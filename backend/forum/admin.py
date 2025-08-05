from django.contrib import admin
from .models import Announcement, Directory, Post, Comment


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'created_at', 'is_active', 'priority')
    list_filter = ('is_active', 'created_at', 'priority')
    search_fields = ('title', 'content')
    ordering = ['-priority', '-created_at']
    fields = ('title', 'content', 'is_active', 'priority')
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new announcement
            obj.author = request.user
        super().save_model(request, obj, form, change)
    
    def has_add_permission(self, request):
        # Allow board members, staff, and superusers to add announcements
        return (request.user.groups.filter(name__in=['board', 'zarząd']).exists() or 
               request.user.is_staff or request.user.is_superuser)
    
    def has_change_permission(self, request, obj=None):
        # Allow board members, staff, and superusers to change announcements
        return (request.user.groups.filter(name__in=['board', 'zarząd']).exists() or 
               request.user.is_staff or request.user.is_superuser)
    
    def has_delete_permission(self, request, obj=None):
        # Allow board members, staff, and superusers to delete announcements
        return (request.user.groups.filter(name__in=['board', 'zarząd']).exists() or 
               request.user.is_staff or request.user.is_superuser)


@admin.register(Directory)
class DirectoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'access_level', 'highlight_style', 'author', 'created_at', 'posts_count', 'subdirectories_count')
    list_filter = ('access_level', 'highlight_style', 'created_at')
    search_fields = ('name', 'description')
    ordering = ['order', 'name']
    
    def posts_count(self, obj):
        return obj.posts.count()
    posts_count.short_description = 'Liczba postów'
    
    def subdirectories_count(self, obj):
        return obj.subdirectories.count()
    subdirectories_count.short_description = 'Liczba podkatalogów'


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'directory', 'author', 'created_at', 'is_pinned', 'is_locked', 'comments_count')
    list_filter = ('directory', 'is_pinned', 'is_locked', 'created_at')
    search_fields = ('title', 'author__username')
    ordering = ['-is_pinned', '-updated_at']
    
    def comments_count(self, obj):
        return obj.get_comments_count()
    comments_count.short_description = 'Liczba komentarzy'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('post', 'author', 'created_at', 'is_edited')
    list_filter = ('is_edited', 'created_at', 'post__directory')
    search_fields = ('content', 'author__username', 'post__title')
    ordering = ['-created_at']
    readonly_fields = ('is_edited', 'created_at', 'updated_at')


