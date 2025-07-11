from django.db import models
from django.contrib.auth.models import User, Group
from django.urls import reverse


class Announcement(models.Model):
    """Model for important announcements that appear at the top of forum"""
    title = models.CharField(max_length=200, verbose_name="Tytuł")
    content = models.TextField(verbose_name="Treść")
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


class Category(models.Model):
    """Model for forum categories"""
    BOARD_ONLY = 'board'
    ALL_USERS = 'all'
    
    ACCESS_CHOICES = [
        (BOARD_ONLY, 'Tylko zarząd'),
        (ALL_USERS, 'Wszyscy użytkownicy'),
    ]
    
    name = models.CharField(max_length=100, verbose_name="Nazwa")
    description = models.TextField(blank=True, verbose_name="Opis")
    access_level = models.CharField(
        max_length=10, 
        choices=ACCESS_CHOICES, 
        default=ALL_USERS,
        verbose_name="Poziom dostępu"
    )
    order = models.IntegerField(default=0, verbose_name="Kolejność")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    
    class Meta:
        verbose_name = "Kategoria"
        verbose_name_plural = "Kategorie"
        ordering = ['order', 'name']
        
    def __str__(self):
        return self.name
    
    def get_absolute_url(self):
        return reverse('forum:category', kwargs={'category_id': self.id})
    
    def can_user_access(self, user):
        """Check if user can access this category"""
        if self.access_level == self.ALL_USERS:
            return True
        elif self.access_level == self.BOARD_ONLY:
            # Check if user is in board group, staff, or superuser
            return (user.groups.filter(name__in=['board', 'zarząd']).exists() or 
                   user.is_staff or user.is_superuser)
        return False


class Directory(models.Model):
    """Model for forum directories/folders within categories"""
    name = models.CharField(max_length=100, verbose_name="Nazwa")
    description = models.TextField(blank=True, verbose_name="Opis")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='directories', verbose_name="Kategoria")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subdirectories', verbose_name="Katalog nadrzędny")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Autor")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data modyfikacji")
    
    class Meta:
        verbose_name = "Katalog"
        verbose_name_plural = "Katalogi"
        ordering = ['name']
        
    def __str__(self):
        if self.parent:
            return f"{self.parent.name} / {self.name}"
        return f"{self.category.name} / {self.name}"
    
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
    
    def can_user_access(self, user):
        """Check if user can access this directory (inherits from category)"""
        return self.category.can_user_access(user)


class Thread(models.Model):
    """Model for forum threads/topics"""
    title = models.CharField(max_length=200, verbose_name="Tytuł")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='threads', verbose_name="Kategoria")
    directory = models.ForeignKey(Directory, on_delete=models.CASCADE, related_name='threads', null=True, blank=True, verbose_name="Katalog")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Autor")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data modyfikacji")
    is_pinned = models.BooleanField(default=False, verbose_name="Przypięty")
    is_locked = models.BooleanField(default=False, verbose_name="Zablokowany")
    
    class Meta:
        verbose_name = "Wątek"
        verbose_name_plural = "Wątki"
        ordering = ['-is_pinned', '-updated_at']
        
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('forum:thread', kwargs={'thread_id': self.id})
    
    def get_comments_count(self):
        return self.comments.count()
    
    def get_last_comment(self):
        return self.comments.order_by('-created_at').first()
    
    def can_user_delete(self, user):
        """Check if user can delete this thread"""
        # Owner, board members, admin, or staff can delete
        return (user == self.author or 
               user.groups.filter(name__in=['board', 'zarząd']).exists() or
               user.is_staff or user.is_superuser)


class Comment(models.Model):
    """Model for forum comments (previously posts)"""
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name='comments', verbose_name="Wątek")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Autor")
    content = models.TextField(verbose_name="Treść")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data utworzenia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data modyfikacji")
    is_edited = models.BooleanField(default=False, verbose_name="Edytowany")
    
    class Meta:
        verbose_name = "Komentarz"
        verbose_name_plural = "Komentarze"
        ordering = ['created_at']
        
    def __str__(self):
        return f"Komentarz w {self.thread.title} - {self.author.username}"
    
    def save(self, *args, **kwargs):
        if self.pk:  # If comment already exists (editing)
            self.is_edited = True
        super().save(*args, **kwargs)
        # Update thread's updated_at when comment is created/updated
        self.thread.updated_at = self.created_at if not self.pk else self.updated_at
        self.thread.save(update_fields=['updated_at'])
    
    def can_user_delete(self, user):
        """Check if user can delete this comment"""
        # Owner, board members, admin, or staff can delete
        return (user == self.author or 
               user.groups.filter(name__in=['board', 'zarząd']).exists() or
               user.is_staff or user.is_superuser)
