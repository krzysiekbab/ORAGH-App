from django.contrib import admin
from .models import Announcement, Category, Directory, Thread, Comment


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


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'access_level', 'order', 'directories_count', 'threads_count')
    list_filter = ('access_level', 'created_at')
    search_fields = ('name', 'description')
    ordering = ['order', 'name']
    
    def directories_count(self, obj):
        return obj.directories.count()
    directories_count.short_description = 'Liczba katalogów'
    
    def threads_count(self, obj):
        return obj.threads.count()
    threads_count.short_description = 'Liczba wątków'


@admin.register(Directory)
class DirectoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'parent', 'author', 'created_at', 'threads_count', 'subdirectories_count')
    list_filter = ('category', 'created_at')
    search_fields = ('name', 'description', 'category__name')
    ordering = ['category', 'parent', 'name']
    
    def threads_count(self, obj):
        return obj.threads.count()
    threads_count.short_description = 'Liczba wątków'
    
    def subdirectories_count(self, obj):
        return obj.subdirectories.count()
    subdirectories_count.short_description = 'Liczba podkatalogów'


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'directory', 'author', 'created_at', 'is_pinned', 'is_locked', 'comments_count')
    list_filter = ('category', 'directory', 'is_pinned', 'is_locked', 'created_at')
    search_fields = ('title', 'author__username')
    ordering = ['-is_pinned', '-updated_at']
    
    def comments_count(self, obj):
        return obj.get_comments_count()
    comments_count.short_description = 'Liczba komentarzy'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('thread', 'author', 'created_at', 'is_edited')
    list_filter = ('is_edited', 'created_at', 'thread__category')
    search_fields = ('content', 'author__username', 'thread__title')
    ordering = ['-created_at']
    readonly_fields = ('is_edited', 'created_at', 'updated_at')
