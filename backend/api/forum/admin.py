from django.contrib import admin
from .models import Directory, Post, Comment


@admin.register(Directory)
class DirectoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'description', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at', 'parent')
    search_fields = ('name', 'description')
    ordering = ('name',)
    raw_id_fields = ('parent',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'parent')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'directory', 'is_pinned', 'is_locked', 'created_at', 'updated_at')
    list_filter = ('is_pinned', 'is_locked', 'created_at', 'updated_at', 'directory')
    search_fields = ('title', 'content', 'author__username', 'author__first_name', 'author__last_name')
    ordering = ('-created_at',)
    raw_id_fields = ('author', 'directory')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {
            'fields': ('title', 'content', 'author', 'directory')
        }),
        ('Options', {
            'fields': ('is_pinned', 'is_locked')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('get_short_content', 'author', 'post', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at', 'post__directory')
    search_fields = ('content', 'author__username', 'author__first_name', 'author__last_name', 'post__title')
    ordering = ('-created_at',)
    raw_id_fields = ('author', 'post')
    readonly_fields = ('created_at', 'updated_at')
    
    def get_short_content(self, obj):
        """Return shortened content for list display"""
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    get_short_content.short_description = 'Content'
    
    fieldsets = (
        (None, {
            'fields': ('content', 'author', 'post')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
