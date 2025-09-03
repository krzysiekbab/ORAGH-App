"""
Forum-related serializers for the API.
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Directory, Post, Comment
from api.users.serializers import UserSerializer


class DirectoryTreeSerializer(serializers.ModelSerializer):
    """Serializer for directory tree structure."""
    author = UserSerializer(read_only=True)
    subdirectories = serializers.SerializerMethodField()
    posts_count = serializers.ReadOnlyField()
    subdirectories_count = serializers.ReadOnlyField()
    last_post = serializers.SerializerMethodField()
    breadcrumb_path = serializers.SerializerMethodField()
    can_access = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    can_create_subdirectory = serializers.SerializerMethodField()
    highlight_icon = serializers.SerializerMethodField()
    
    class Meta:
        model = Directory
        fields = [
            'id', 'name', 'description', 'parent', 'access_level', 'highlight_style',
            'order', 'author', 'created_at', 'updated_at', 'subdirectories',
            'posts_count', 'subdirectories_count', 'last_post', 'breadcrumb_path',
            'can_access', 'can_edit', 'can_delete', 'can_create_subdirectory',
            'highlight_icon'
        ]
        read_only_fields = [
            'id', 'author', 'created_at', 'updated_at', 'subdirectories',
            'posts_count', 'subdirectories_count', 'last_post', 'breadcrumb_path',
            'can_access', 'can_edit', 'can_delete', 'can_create_subdirectory',
            'highlight_icon'
        ]
    
    def get_subdirectories(self, obj):
        """Get subdirectories that the user can access."""
        request = self.context.get('request')
        if not request:
            return []
        
        subdirectories = obj.subdirectories.filter()
        accessible_subdirs = [
            subdir for subdir in subdirectories 
            if subdir.can_user_access(request.user)
        ]
        return DirectoryTreeSerializer(accessible_subdirs, many=True, context=self.context).data
    
    def get_last_post(self, obj):
        """Get the most recent post in this directory."""
        last_post = obj.get_last_post()
        if last_post:
            return {
                'id': last_post.id,
                'title': last_post.title,
                'author': {
                    'id': last_post.author.id,
                    'username': last_post.author.username,
                    'first_name': last_post.author.first_name,
                    'last_name': last_post.author.last_name,
                },
                'created_at': last_post.created_at,
                'updated_at': last_post.updated_at,
            }
        return None
    
    def get_breadcrumb_path(self, obj):
        """Get breadcrumb path for this directory."""
        path = obj.get_breadcrumb_path()
        return [
            {
                'id': dir.id,
                'name': dir.name,
            }
            for dir in path
        ]
    
    def get_can_access(self, obj):
        """Check if current user can access this directory."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return obj.access_level == Directory.ALL_USERS
        return obj.can_user_access(request.user)
    
    def get_can_edit(self, obj):
        """Check if current user can edit this directory."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_edit(request.user)
    
    def get_can_delete(self, obj):
        """Check if current user can delete this directory."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_delete(request.user)
    
    def get_can_create_subdirectory(self, obj):
        """Check if current user can create subdirectories."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_create_subdirectory(request.user)
    
    def get_highlight_icon(self, obj):
        """Get highlight icon for this directory."""
        return obj.get_highlight_icon()


class DirectoryListSerializer(serializers.ModelSerializer):
    """Serializer for directory list view."""
    author = UserSerializer(read_only=True)
    posts_count = serializers.ReadOnlyField()
    subdirectories_count = serializers.ReadOnlyField()
    last_post = serializers.SerializerMethodField()
    can_access = serializers.SerializerMethodField()
    highlight_icon = serializers.SerializerMethodField()
    full_path = serializers.SerializerMethodField()
    
    class Meta:
        model = Directory
        fields = [
            'id', 'name', 'description', 'parent', 'access_level', 'highlight_style',
            'order', 'author', 'created_at', 'updated_at', 'posts_count',
            'subdirectories_count', 'last_post', 'can_access', 'highlight_icon', 'full_path'
        ]
        read_only_fields = [
            'id', 'author', 'created_at', 'updated_at', 'posts_count',
            'subdirectories_count', 'last_post', 'can_access', 'highlight_icon', 'full_path'
        ]
    
    def get_last_post(self, obj):
        """Get the most recent post in this directory."""
        last_post = obj.get_last_post()
        if last_post:
            return {
                'id': last_post.id,
                'title': last_post.title,
                'author': {
                    'id': last_post.author.id,
                    'username': last_post.author.username,
                    'first_name': last_post.author.first_name,
                    'last_name': last_post.author.last_name,
                },
                'created_at': last_post.created_at,
                'updated_at': last_post.updated_at,
            }
        return None
    
    def get_can_access(self, obj):
        """Check if current user can access this directory."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return obj.access_level == Directory.ALL_USERS
        return obj.can_user_access(request.user)
    
    def get_highlight_icon(self, obj):
        """Get highlight icon for this directory."""
        return obj.get_highlight_icon()
    
    def get_full_path(self, obj):
        """Get full path of the directory."""
        return obj.get_full_path()


class DirectoryCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating directories."""
    
    class Meta:
        model = Directory
        fields = [
            'name', 'description', 'parent', 'access_level', 
            'highlight_style', 'order'
        ]
    
    def validate_parent(self, value):
        """Validate parent directory."""
        if value:
            # Check if user can access parent directory
            request = self.context.get('request')
            if request and not value.can_user_access(request.user):
                raise serializers.ValidationError(
                    "Nie masz dostępu do wybranego katalogu nadrzędnego."
                )
            
            # Prevent circular references
            if self.instance and value == self.instance:
                raise serializers.ValidationError(
                    "Katalog nie może być swoim własnym rodzicem."
                )
            
            # Check for circular dependency
            if self.instance:
                current = value
                while current:
                    if current == self.instance:
                        raise serializers.ValidationError(
                            "Wybór tego katalogu jako rodzica utworzyłby cykliczną zależność."
                        )
                    current = current.parent
        
        return value


class PostListSerializer(serializers.ModelSerializer):
    """Serializer for post list view."""
    author = UserSerializer(read_only=True)
    directory = DirectoryListSerializer(read_only=True)
    comments_count = serializers.ReadOnlyField()
    last_comment = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    can_pin = serializers.SerializerMethodField()
    can_lock = serializers.SerializerMethodField()
    content_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content_preview', 'directory', 'author', 'created_at',
            'updated_at', 'is_pinned', 'is_locked', 'comments_count', 'last_comment',
            'can_edit', 'can_delete', 'can_pin', 'can_lock'
        ]
        read_only_fields = [
            'id', 'author', 'created_at', 'updated_at', 'comments_count',
            'last_comment', 'can_edit', 'can_delete', 'can_pin', 'can_lock',
            'content_preview'
        ]
    
    def get_content_preview(self, obj):
        """Get truncated content for preview."""
        if len(obj.content) > 200:
            return obj.content[:200] + '...'
        return obj.content
    
    def get_last_comment(self, obj):
        """Get the most recent comment on this post."""
        last_comment = obj.get_last_comment()
        if last_comment:
            return {
                'id': last_comment.id,
                'author': {
                    'id': last_comment.author.id,
                    'username': last_comment.author.username,
                    'first_name': last_comment.author.first_name,
                    'last_name': last_comment.author.last_name,
                },
                'created_at': last_comment.created_at,
                'content_preview': (last_comment.content[:100] + '...' 
                                  if len(last_comment.content) > 100 
                                  else last_comment.content)
            }
        return None
    
    def get_can_edit(self, obj):
        """Check if current user can edit this post."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_edit(request.user)
    
    def get_can_delete(self, obj):
        """Check if current user can delete this post."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_delete(request.user)
    
    def get_can_pin(self, obj):
        """Check if current user can pin this post."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_pin(request.user)
    
    def get_can_lock(self, obj):
        """Check if current user can lock this post."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_lock(request.user)


class PostDetailSerializer(serializers.ModelSerializer):
    """Serializer for post detail view."""
    author = UserSerializer(read_only=True)
    directory = DirectoryTreeSerializer(read_only=True)
    comments = serializers.SerializerMethodField()
    comments_count = serializers.ReadOnlyField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    can_pin = serializers.SerializerMethodField()
    can_lock = serializers.SerializerMethodField()
    can_comment = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'directory', 'author', 'created_at',
            'updated_at', 'is_pinned', 'is_locked', 'comments', 'comments_count',
            'can_edit', 'can_delete', 'can_pin', 'can_lock', 'can_comment'
        ]
        read_only_fields = [
            'id', 'author', 'created_at', 'updated_at', 'comments',
            'comments_count', 'can_edit', 'can_delete', 'can_pin', 'can_lock',
            'can_comment'
        ]
    
    def get_comments(self, obj):
        """Get comments for this post."""
        comments = obj.comments.all()
        return CommentSerializer(comments, many=True, context=self.context).data
    
    def get_can_edit(self, obj):
        """Check if current user can edit this post."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_edit(request.user)
    
    def get_can_delete(self, obj):
        """Check if current user can delete this post."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_delete(request.user)
    
    def get_can_pin(self, obj):
        """Check if current user can pin this post."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_pin(request.user)
    
    def get_can_lock(self, obj):
        """Check if current user can lock this post."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_lock(request.user)
    
    def get_can_comment(self, obj):
        """Check if current user can comment on this post."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        # Can comment if post is not locked and user can access the directory
        return not obj.is_locked and obj.can_user_access(request.user)


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating posts."""
    
    class Meta:
        model = Post
        fields = ['title', 'content', 'directory', 'is_pinned', 'is_locked']
    
    def validate_directory(self, value):
        """Validate directory access."""
        request = self.context.get('request')
        if request and not value.can_user_access(request.user):
            raise serializers.ValidationError(
                "Nie masz dostępu do wybranego katalogu."
            )
        return value
    
    def validate(self, attrs):
        """Validate post data."""
        request = self.context.get('request')
        
        # Check pinning permissions
        if attrs.get('is_pinned', False):
            if not request or not request.user.is_authenticated:
                raise serializers.ValidationError(
                    "Nie masz uprawnień do przypinania postów."
                )
            # Check if it's an update and user can pin
            if self.instance and not self.instance.can_user_pin(request.user):
                raise serializers.ValidationError(
                    "Nie masz uprawnień do przypinania postów."
                )
        
        # Check locking permissions
        if attrs.get('is_locked', False):
            if not request or not request.user.is_authenticated:
                raise serializers.ValidationError(
                    "Nie masz uprawnień do blokowania postów."
                )
            # Check if it's an update and user can lock
            if self.instance and not self.instance.can_user_lock(request.user):
                raise serializers.ValidationError(
                    "Nie masz uprawnień do blokowania postów."
                )
        
        return attrs


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments."""
    author = UserSerializer(read_only=True)
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'content', 'author', 'created_at', 'updated_at',
            'is_edited', 'can_edit', 'can_delete'
        ]
        read_only_fields = [
            'id', 'author', 'created_at', 'updated_at', 'is_edited',
            'can_edit', 'can_delete'
        ]
    
    def get_can_edit(self, obj):
        """Check if current user can edit this comment."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_edit(request.user)
    
    def get_can_delete(self, obj):
        """Check if current user can delete this comment."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_delete(request.user)


class CommentCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating comments."""
    
    class Meta:
        model = Comment
        fields = ['content']
    
    def validate(self, attrs):
        """Validate comment data."""
        # Check if post allows comments (not locked)
        post = self.context.get('post')
        if post and post.is_locked:
            raise serializers.ValidationError(
                "Ten post jest zablokowany i nie można dodawać komentarzy."
            )
        
        return attrs
