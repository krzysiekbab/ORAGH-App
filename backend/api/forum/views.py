"""
Forum-related API views.
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import Group
from django.db import transaction
from .models import Directory, Post, Comment
from .serializers import (
    DirectoryTreeSerializer,
    DirectoryListSerializer,
    DirectoryCreateUpdateSerializer,
    PostListSerializer,
    PostDetailSerializer,
    PostCreateUpdateSerializer,
    CommentSerializer,
    CommentCreateUpdateSerializer,
)


class ForumPagination(PageNumberPagination):
    """Custom pagination for forum."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# Directory Views
class DirectoryTreeView(generics.ListAPIView):
    """Get directory tree structure (root directories with subdirectories)."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DirectoryTreeSerializer
    pagination_class = None  # Disable pagination for tree view
    
    def get_queryset(self):
        """Get root directories that the user can access."""
        root_directories = Directory.objects.filter(parent=None).select_related('author').order_by('order', 'name')
        
        # Filter directories user can access
        accessible_dirs = [
            directory for directory in root_directories 
            if directory.can_user_access(self.request.user)
        ]
        
        return accessible_dirs
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class DirectoryListCreateView(generics.ListCreateAPIView):
    """List all directories or create a new directory."""
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = ForumPagination
    
    def get_queryset(self):
        """Get directories queryset with filters."""
        queryset = Directory.objects.select_related('author', 'parent').order_by('order', 'name')
        
        # Filter by parent
        parent_id = self.request.query_params.get('parent')
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        elif parent_id == '':  # Empty string means root directories
            queryset = queryset.filter(parent=None)
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        # Filter directories user can access
        accessible_dirs = [
            directory for directory in queryset 
            if directory.can_user_access(self.request.user)
        ]
        
        return accessible_dirs
    
    def get_serializer_class(self):
        """Use different serializers for list and create."""
        if self.request.method == 'POST':
            return DirectoryCreateUpdateSerializer
        return DirectoryListSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Set the author field when creating a directory."""
        # Check if user can create directories
        if not (self.request.user.groups.filter(name='board').exists() or
                self.request.user.is_staff or self.request.user.is_superuser):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Nie masz uprawnień do tworzenia katalogów.")
        serializer.save(author=self.request.user)


class DirectoryDetailUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a directory."""
    permission_classes = [permissions.IsAuthenticated]
    queryset = Directory.objects.select_related('author', 'parent')
    
    def get_serializer_class(self):
        """Use different serializers for retrieve and update."""
        if self.request.method in ['PUT', 'PATCH']:
            return DirectoryCreateUpdateSerializer
        return DirectoryTreeSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def retrieve(self, request, *args, **kwargs):
        """Check access before retrieving."""
        directory = self.get_object()
        if not directory.can_user_access(request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Nie masz dostępu do tego katalogu.")
        return super().retrieve(request, *args, **kwargs)
    
    def perform_update(self, serializer):
        """Check permissions before updating."""
        directory = self.get_object()
        if not directory.can_user_edit(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Nie masz uprawnień do edytowania tego katalogu.")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Check permissions before deleting."""
        if not instance.can_user_delete(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Nie masz uprawnień do usuwania tego katalogu.")
        
        # Check if directory has posts or subdirectories
        if instance.posts.exists() or instance.subdirectories.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Nie można usunąć katalogu zawierającego posty lub podkatalogi.")
        
        instance.delete()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def move_directory(request, pk):
    """Move directory to another parent directory."""
    directory = get_object_or_404(Directory, pk=pk)
    
    # Check if user can edit this directory
    if not directory.can_user_edit(request.user):
        return Response(
            {'error': 'Nie masz uprawnień do przenoszenia tego katalogu.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    new_parent_id = request.data.get('parent_id')
    
    if new_parent_id:
        new_parent = get_object_or_404(Directory, pk=new_parent_id)
        
        # Check if user can access new parent
        if not new_parent.can_user_access(request.user):
            return Response(
                {'error': 'Nie masz dostępu do docelowego katalogu.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Prevent circular references
        current = new_parent
        while current:
            if current == directory:
                return Response(
                    {'error': 'Nie można przenieść katalogu do swojego podkatalogu.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            current = current.parent
        
        directory.parent = new_parent
    else:
        # Move to root level
        directory.parent = None
    
    directory.save()
    
    serializer = DirectoryTreeSerializer(directory, context={'request': request})
    return Response(serializer.data)


# Post Views
class PostListCreateView(generics.ListCreateAPIView):
    """List posts or create a new post."""
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = ForumPagination
    
    def get_queryset(self):
        """Get posts queryset with filters."""
        queryset = Post.objects.select_related('author', 'directory').prefetch_related('comments')
        
        # Filter by directory
        directory_id = self.request.query_params.get('directory')
        if directory_id:
            directory = get_object_or_404(Directory, pk=directory_id)
            # Check if user can access directory
            if not directory.can_user_access(self.request.user):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Nie masz dostępu do tego katalogu.")
            queryset = queryset.filter(directory=directory)
        
        # Filter by author
        author_id = self.request.query_params.get('author')
        if author_id:
            queryset = queryset.filter(author_id=author_id)
        
        # Search by title or content
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                title__icontains=search
            ) | queryset.filter(
                content__icontains=search
            )
        
        # Filter posts from directories user can access
        accessible_posts = [
            post for post in queryset 
            if post.can_user_access(self.request.user)
        ]
        
        return accessible_posts
    
    def get_serializer_class(self):
        """Use different serializers for list and create."""
        if self.request.method == 'POST':
            return PostCreateUpdateSerializer
        return PostListSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Set the author field when creating a post."""
        serializer.save(author=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Override create to return list serializer response."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return the created post using the list serializer
        post = serializer.instance
        list_serializer = PostListSerializer(post, context={'request': request})
        
        headers = self.get_success_headers(serializer.data)
        return Response(list_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class PostDetailUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a post."""
    permission_classes = [permissions.IsAuthenticated]
    queryset = Post.objects.select_related('author', 'directory').prefetch_related('comments__author')
    
    def get_serializer_class(self):
        """Use different serializers for retrieve and update."""
        if self.request.method in ['PUT', 'PATCH']:
            return PostCreateUpdateSerializer
        return PostDetailSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def retrieve(self, request, *args, **kwargs):
        """Check access before retrieving."""
        post = self.get_object()
        if not post.can_user_access(request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Nie masz dostępu do tego posta.")
        return super().retrieve(request, *args, **kwargs)
    
    def perform_update(self, serializer):
        """Check permissions before updating."""
        post = self.get_object()
        if not post.can_user_edit(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Nie masz uprawnień do edytowania tego posta.")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Check permissions before deleting."""
        if not instance.can_user_delete(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Nie masz uprawnień do usuwania tego posta.")
        instance.delete()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def move_post(request, pk):
    """Move post to another directory."""
    post = get_object_or_404(Post, pk=pk)
    
    # Check if user can edit this post
    if not post.can_user_edit(request.user):
        return Response(
            {'error': 'Nie masz uprawnień do przenoszenia tego posta.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    new_directory_id = request.data.get('directory_id')
    new_directory = get_object_or_404(Directory, pk=new_directory_id)
    
    # Check if user can access new directory
    if not new_directory.can_user_access(request.user):
        return Response(
            {'error': 'Nie masz dostępu do docelowego katalogu.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    post.directory = new_directory
    post.save()
    
    serializer = PostDetailSerializer(post, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_post_pin(request, pk):
    """Toggle post pin status."""
    post = get_object_or_404(Post, pk=pk)
    
    # Check if user can pin this post
    if not post.can_user_pin(request.user):
        return Response(
            {'error': 'Nie masz uprawnień do przypinania postów.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    post.is_pinned = not post.is_pinned
    post.save()
    
    return Response({
        'id': post.id,
        'is_pinned': post.is_pinned,
        'message': 'Post został przypięty.' if post.is_pinned else 'Post został odpięty.'
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_post_lock(request, pk):
    """Toggle post lock status."""
    post = get_object_or_404(Post, pk=pk)
    
    # Check if user can lock this post
    if not post.can_user_lock(request.user):
        return Response(
            {'error': 'Nie masz uprawnień do blokowania postów.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    post.is_locked = not post.is_locked
    post.save()
    
    return Response({
        'id': post.id,
        'is_locked': post.is_locked,
        'message': 'Post został zablokowany.' if post.is_locked else 'Post został odblokowany.'
    })


# Comment Views
class CommentListCreateView(generics.ListCreateAPIView):
    """List comments for a post or create a new comment."""
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = ForumPagination
    
    def get_queryset(self):
        """Get comments for the specified post."""
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(Post, pk=post_id)
        
        # Check if user can access the post
        if not post.can_user_access(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Nie masz dostępu do tego posta.")
        
        return post.comments.select_related('author').order_by('created_at')
    
    def get_serializer_class(self):
        """Use different serializers for list and create."""
        if self.request.method == 'POST':
            return CommentCreateUpdateSerializer
        return CommentSerializer
    
    def get_serializer_context(self):
        """Add request and post to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        post_id = self.kwargs.get('post_id')
        context['post'] = get_object_or_404(Post, pk=post_id)
        return context
    
    def perform_create(self, serializer):
        """Set the author and post fields when creating a comment."""
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(Post, pk=post_id)
        
        # Check if user can access the post
        if not post.can_user_access(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Nie masz dostępu do tego posta.")
        
        # Check if post is locked
        if post.is_locked:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Ten post jest zablokowany i nie można dodawać komentarzy.")
        
        serializer.save(author=self.request.user, post=post)


class CommentDetailUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a comment."""
    permission_classes = [permissions.IsAuthenticated]
    queryset = Comment.objects.select_related('author', 'post__directory')
    
    def get_serializer_class(self):
        """Use different serializers for retrieve and update."""
        if self.request.method in ['PUT', 'PATCH']:
            return CommentCreateUpdateSerializer
        return CommentSerializer
    
    def get_serializer_context(self):
        """Add request and post to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        comment = self.get_object()
        context['post'] = comment.post
        return context
    
    def retrieve(self, request, *args, **kwargs):
        """Check access before retrieving."""
        comment = self.get_object()
        if not comment.post.can_user_access(request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Nie masz dostępu do tego komentarza.")
        return super().retrieve(request, *args, **kwargs)
    
    def perform_update(self, serializer):
        """Check permissions before updating."""
        comment = self.get_object()
        if not comment.can_user_edit(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Nie masz uprawnień do edytowania tego komentarza.")
        
        # Check if post is locked
        if comment.post.is_locked:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Ten post jest zablokowany i nie można edytować komentarzy.")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Check permissions before deleting."""
        if not instance.can_user_delete(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Nie masz uprawnień do usuwania tego komentarza.")
        instance.delete()


# Forum Statistics and Permissions
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def forum_stats(request):
    """Get forum statistics."""
    # Get accessible directories for user
    all_directories = Directory.objects.all()
    accessible_dirs = [d for d in all_directories if d.can_user_access(request.user)]
    
    # Get accessible posts
    all_posts = Post.objects.all()
    accessible_posts = [p for p in all_posts if p.can_user_access(request.user)]
    
    # Get comments count from accessible posts
    accessible_post_ids = [p.id for p in accessible_posts]
    comments_count = Comment.objects.filter(post_id__in=accessible_post_ids).count()
    
    stats = {
        'directories_count': len(accessible_dirs),
        'posts_count': len(accessible_posts),
        'comments_count': comments_count,
        'announcements_count': 0,  # Announcements removed
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def forum_permissions(request):
    """Get forum permissions for current user."""
    user = request.user
    
    permissions = {
        'can_create_directory': (
            user.groups.filter(name='board').exists() or
            user.is_staff or user.is_superuser
        ),
        'can_create_announcement': (
            user.groups.filter(name='board').exists() or
            user.is_staff or user.is_superuser
        ),
        'can_pin_posts': (
            user.groups.filter(name='board').exists() or
            user.is_staff or user.is_superuser
        ),
        'can_lock_posts': (
            user.groups.filter(name='board').exists() or
            user.is_staff or user.is_superuser
        ),
        'is_board_member': (
            user.groups.filter(name='board').exists() or
            user.is_staff or user.is_superuser
        ),
    }
    
    return Response(permissions)
