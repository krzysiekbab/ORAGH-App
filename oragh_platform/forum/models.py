from django.db import models
from django.contrib.auth.models import User, Group
from django.urls import reverse
from django_ckeditor_5.fields import CKEditor5Field


class Announcement(models.Model):
    """Model for important announcements that appear at the top of forum"""
    title = models.CharField(max_length=200, verbose_name="Tytuł")
    content = CKEditor5Field(verbose_name="Treść", config_name='forum')
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Autor")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data modyfikacji")
    is_active = models.BooleanField(default=True, verbose_name="Aktywne")
    priority = models.IntegerField(default=0, verbose_name="Priorytet")
    
    class Meta:
        verbose_name = "Ogłoszenie"
        verbose_name_plural = "Ogłoszenia"
        ordering = ['-priority', '-created_at']
        
    def __str__(self):
        return self.title


class Directory(models.Model):
    """Model for forum directories - hierarchical structure that can contain subdirectories and posts"""
    BOARD_ONLY = 'board'
    ALL_USERS = 'all'
    
    ACCESS_CHOICES = [
        (BOARD_ONLY, 'Tylko zarząd'),
        (ALL_USERS, 'Wszyscy użytkownicy'),
    ]
    
    # Highlight style choices for special directories
    HIGHLIGHT_CHOICES = [
        ('none', 'Brak wyróżnienia'),
        ('management', 'Dział zarządu - niebieski'),
        ('orchestra', 'Dział orkiestry - zielony'),
        ('entertainment', 'Dział rozrywki - pomarańczowy'),
        ('important', 'Ważne - czerwony'),
    ]
    
    name = models.CharField(max_length=100, verbose_name="Nazwa")
    description = models.TextField(blank=True, verbose_name="Opis")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subdirectories', verbose_name="Katalog nadrzędny")
    access_level = models.CharField(
        max_length=10, 
        choices=ACCESS_CHOICES, 
        default=ALL_USERS,
        verbose_name="Poziom dostępu"
    )
    highlight_style = models.CharField(
        max_length=20,
        choices=HIGHLIGHT_CHOICES,
        default='none',
        verbose_name="Styl wyróżnienia"
    )
    order = models.IntegerField(default=0, verbose_name="Kolejność")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Autor")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data modyfikacji")
    
    class Meta:
        verbose_name = "Katalog"
        verbose_name_plural = "Katalogi"
        ordering = ['order', 'name']
        
    def __str__(self):
        if self.parent:
            return f"{self.get_full_path()}"
        return self.name
    
    def get_absolute_url(self):
        return reverse('forum:directory', kwargs={'directory_id': self.id})
    
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
                if not (user.groups.filter(name__in=['board', 'zarząd']).exists() or 
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


class Post(models.Model):
    """Model for forum posts/topics"""
    title = models.CharField(max_length=200, verbose_name="Tytuł")
    directory = models.ForeignKey(Directory, on_delete=models.CASCADE, related_name='posts', verbose_name="Katalog")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Autor")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data modyfikacji")
    is_pinned = models.BooleanField(default=False, verbose_name="Przypięty")
    is_locked = models.BooleanField(default=False, verbose_name="Zablokowany")
    
    class Meta:
        verbose_name = "Post"
        verbose_name_plural = "Posty"
        ordering = ['-is_pinned', '-updated_at']
        
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('forum:post', kwargs={'post_id': self.id})
    
    def get_comments_count(self):
        return self.comments.count()
    
    def get_last_comment(self):
        return self.comments.order_by('-created_at').first()
    
    def can_user_delete(self, user):
        """Check if user can delete this post"""
        # Owner, board members, admin, or staff can delete
        return (user == self.author or 
               user.groups.filter(name__in=['board', 'zarząd']).exists() or
               user.is_staff or user.is_superuser)
    
    def can_user_access(self, user):
        """Check if user can access this post (inherits from directory)"""
        return self.directory.can_user_access(user)


class Comment(models.Model):
    """Model for forum comments in posts"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments', verbose_name="Post")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Autor")
    content = CKEditor5Field(verbose_name="Treść", config_name='forum')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data modyfikacji")
    is_edited = models.BooleanField(default=False, verbose_name="Edytowany")
    
    class Meta:
        verbose_name = "Komentarz"
        verbose_name_plural = "Komentarze"
        ordering = ['created_at']
        
    def __str__(self):
        return f"Komentarz w {self.post.title} - {self.author.username}"
    
    def save(self, *args, **kwargs):
        if self.pk:  # If comment already exists (editing)
            self.is_edited = True
        super().save(*args, **kwargs)
        # Update post's updated_at when comment is created/updated
        self.post.updated_at = self.created_at if not self.pk else self.updated_at
        self.post.save(update_fields=['updated_at'])
    
    def can_user_delete(self, user):
        """Check if user can delete this comment"""
        # Owner, board members, admin, or staff can delete
        return (user == self.author or 
               user.groups.filter(name__in=['board', 'zarząd']).exists() or
               user.is_staff or user.is_superuser)


