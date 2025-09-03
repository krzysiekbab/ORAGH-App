"""
Forum models for the new API structure.
"""

from django.db import models
from django.contrib.auth.models import User


class Directory(models.Model):
    """Model for forum directories - hierarchical structure that can contain subdirectories and posts"""
    BOARD_ONLY = 'board'
    ALL_USERS = 'all'
    
    ACCESS_LEVEL_CHOICES = [
        (ALL_USERS, 'Wszyscy'),
        (BOARD_ONLY, 'Tylko board'),
    ]
    
    # Highlight style choices for special directories
    HIGHLIGHT_STYLE_CHOICES = [
        ('none', 'Normalny'),
        ('management', 'Dział board - niebieski'),
        ('orchestra', 'Orkiestra - zielony'),
        ('entertainment', 'Rozrywka - pomarańczowy'),
        ('important', 'Ważne - czerwony'),
    ]
    
    name = models.CharField(max_length=100, verbose_name="Nazwa")
    description = models.TextField(blank=True, verbose_name="Opis")
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='subdirectories', 
        verbose_name="Katalog nadrzędny"
    )
    access_level = models.CharField(
        max_length=10, 
        choices=ACCESS_LEVEL_CHOICES, 
        default=ALL_USERS,
        verbose_name="Poziom dostępu"
    )
    highlight_style = models.CharField(
        max_length=20,
        choices=HIGHLIGHT_STYLE_CHOICES,
        default='none',
        verbose_name="Styl wyróżnienia"
    )
    order = models.IntegerField(default=0, verbose_name="Kolejność")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Autor")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data modyfikacji")
    
    class Meta:
        db_table = 'forum_directory'
        verbose_name = "Katalog"
        verbose_name_plural = "Katalogi"
        ordering = ['order', 'name']
        indexes = [
            models.Index(fields=['parent', 'order', 'name']),
            models.Index(fields=['access_level']),
            models.Index(fields=['author']),
        ]
        permissions = [
            ('can_create_directory', 'Can create forum directories'),
            ('can_manage_directories', 'Can manage all forum directories'),
        ]
        
    def __str__(self):
        if self.parent:
            return f"{self.get_full_path()}"
        return self.name
    
    def get_full_path(self):
        """Get full path of the directory"""
        path = [self.name]
        current = self.parent
        while current:
            path.insert(0, current.name)
            current = current.parent
        return ' / '.join(path)
    
    def get_root_directory(self):
        """Get the root directory of this directory"""
        current = self
        while current.parent:
            current = current.parent
        return current
    
    def get_breadcrumb_path(self):
        """Get breadcrumb path as list of directories from root to current"""
        path = []
        current = self
        while current:
            path.insert(0, current)
            current = current.parent
        return path
    
    def can_user_access(self, user):
        """Check if user can access this directory"""
        # Check access level of this directory and all parent directories
        current = self
        while current:
            if current.access_level == self.BOARD_ONLY:
                if not (user.groups.filter(name='board').exists() or 
                       user.is_staff or user.is_superuser):
                    return False
            current = current.parent
        return True

    def get_highlight_classes(self):
        """Get CSS classes for highlighting this directory"""
        highlight_map = {
            'management': 'directory-highlight-management',
            'orchestra': 'directory-highlight-orchestra', 
            'entertainment': 'directory-highlight-entertainment',
            'important': 'directory-highlight-important',
        }
        return highlight_map.get(self.highlight_style, '')

    def get_highlight_icon(self):
        """Get icon for the highlighted directory"""
        icon_map = {
            'management': '⚙️',
            'orchestra': '🎼',
            'entertainment': '🎉',
            'important': '⚠️',
        }
        return icon_map.get(self.highlight_style, '📁')
    
    def is_root(self):
        """Check if this is a root directory (no parent)"""
        return self.parent is None

    def can_user_edit(self, user):
        """Check if user can edit this directory."""
        if not user or not user.is_authenticated:
            return False
        # Only board members and staff can edit directories
        return (user.groups.filter(name='board').exists() or
                user.is_staff or user.is_superuser)

    def can_user_delete(self, user):
        """Check if user can delete this directory."""
        if not user or not user.is_authenticated:
            return False
        # Only board members and staff can delete directories
        return (user.groups.filter(name='board').exists() or
                user.is_staff or user.is_superuser)

    def can_user_create_subdirectory(self, user):
        """Check if user can create subdirectories in this directory."""
        if not user or not user.is_authenticated:
            return False
        # Only board members and staff can create directories
        return (user.groups.filter(name='board').exists() or
                user.is_staff or user.is_superuser)

    @property
    def posts_count(self):
        """Return the number of posts in this directory."""
        return self.posts.count()

    @property
    def subdirectories_count(self):
        """Return the number of subdirectories in this directory."""
        return self.subdirectories.count()

    def get_last_post(self):
        """Get the most recent post in this directory."""
        return self.posts.order_by('-updated_at').first()


class Post(models.Model):
    """Model for forum posts/topics"""
    title = models.CharField(max_length=200, verbose_name="Tytuł")
    content = models.TextField(verbose_name="Treść")
    directory = models.ForeignKey(
        Directory, 
        on_delete=models.CASCADE, 
        related_name='posts', 
        verbose_name="Katalog"
    )
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Autor")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data modyfikacji")
    is_pinned = models.BooleanField(default=False, verbose_name="Przypięty")
    is_locked = models.BooleanField(default=False, verbose_name="Zablokowany")
    
    class Meta:
        db_table = 'forum_post'
        verbose_name = "Post"
        verbose_name_plural = "Posty"
        ordering = ['-is_pinned', '-updated_at']
        indexes = [
            models.Index(fields=['directory', '-is_pinned', '-updated_at']),
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
        permissions = [
            ('can_pin_posts', 'Can pin forum posts'),
            ('can_lock_posts', 'Can lock forum posts'),
            ('can_moderate_posts', 'Can moderate all forum posts'),
        ]
        
    def __str__(self):
        return self.title
    
    @property
    def comments_count(self):
        """Return the number of comments on this post."""
        return self.comments.count()
    
    def get_last_comment(self):
        """Get the most recent comment on this post."""
        return self.comments.order_by('-created_at').first()
    
    def can_user_edit(self, user):
        """Check if user can edit this post."""
        if not user or not user.is_authenticated:
            return False
        # Owner, board members, admin, or staff can edit
        return (user == self.author or 
               user.groups.filter(name='board').exists() or
               user.is_staff or user.is_superuser)
    
    def can_user_delete(self, user):
        """Check if user can delete this post."""
        if not user or not user.is_authenticated:
            return False
        # Owner, board members, admin, or staff can delete
        return (user == self.author or 
               user.groups.filter(name='board').exists() or
               user.is_staff or user.is_superuser)
    
    def can_user_access(self, user):
        """Check if user can access this post (inherits from directory)"""
        return self.directory.can_user_access(user)

    def can_user_pin(self, user):
        """Check if user can pin/unpin this post."""
        if not user or not user.is_authenticated:
            return False
        # Only board members and staff can pin posts
        return (user.groups.filter(name='board').exists() or
                user.is_staff or user.is_superuser)

    def can_user_lock(self, user):
        """Check if user can lock/unlock this post."""
        if not user or not user.is_authenticated:
            return False
        # Only board members and staff can lock posts
        return (user.groups.filter(name='board').exists() or
                user.is_staff or user.is_superuser)


class Comment(models.Model):
    """Model for forum comments in posts"""
    post = models.ForeignKey(
        Post, 
        on_delete=models.CASCADE, 
        related_name='comments', 
        verbose_name="Post"
    )
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Autor")
    content = models.TextField(verbose_name="Treść")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data modyfikacji")
    is_edited = models.BooleanField(default=False, verbose_name="Edytowany")
    
    class Meta:
        db_table = 'forum_comment'
        verbose_name = "Komentarz"
        verbose_name_plural = "Komentarze"
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', 'created_at']),
            models.Index(fields=['author', '-created_at']),
        ]
        permissions = [
            ('can_moderate_comments', 'Can moderate all forum comments'),
        ]
        
    def __str__(self):
        return f"Komentarz w {self.post.title} - {self.author.username}"
    
    def save(self, *args, **kwargs):
        if self.pk:  # If comment already exists (editing)
            self.is_edited = True
        super().save(*args, **kwargs)
        # Update post's updated_at when comment is created/updated
        self.post.updated_at = self.created_at if not self.pk else self.updated_at
        self.post.save(update_fields=['updated_at'])
    
    def can_user_edit(self, user):
        """Check if user can edit this comment."""
        if not user or not user.is_authenticated:
            return False
        # Owner, board members, admin, or staff can edit
        return (user == self.author or 
               user.groups.filter(name='board').exists() or
               user.is_staff or user.is_superuser)
    
    def can_user_delete(self, user):
        """Check if user can delete this comment."""
        if not user or not user.is_authenticated:
            return False
        # Owner, board members, admin, or staff can delete
        return (user == self.author or 
               user.groups.filter(name='board').exists() or
               user.is_staff or user.is_superuser)
