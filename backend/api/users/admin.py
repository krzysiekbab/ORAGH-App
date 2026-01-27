from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html
from django.urls import reverse
from django.contrib import messages
from .models import MusicianProfile, AccountActivationToken


@admin.register(MusicianProfile)
class MusicianProfileAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'get_username', 'instrument', 'active', 'birthday')
    list_filter = ('active', 'instrument')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'instrument')
    ordering = ('user__last_name', 'user__first_name')
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Profile Information', {
            'fields': ('instrument', 'birthday', 'photo', 'active')
        }),
    )
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_full_name.short_description = 'Full Name'
    get_full_name.admin_order_field = 'user__last_name'
    
    def get_username(self, obj):
        return obj.user.username
    get_username.short_description = 'Username'
    get_username.admin_order_field = 'user__username'


# Extend the default User admin to show MusicianProfile info
class MusicianProfileInline(admin.StackedInline):
    model = MusicianProfile
    can_delete = False
    verbose_name_plural = 'Musician Profile'
    extra = 0


class CustomUserAdmin(BaseUserAdmin):
    inlines = (MusicianProfileInline,)
    
    def get_inline_instances(self, request, obj=None):
        if not obj:
            return list()
        return super().get_inline_instances(request, obj)


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


@admin.register(AccountActivationToken)
class AccountActivationTokenAdmin(admin.ModelAdmin):
    """Admin panel for managing account activation tokens."""
    list_display = ('get_user_name', 'get_user_email', 'created_at', 'is_used', 'get_status')
    list_filter = ('is_used', 'created_at')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name')
    ordering = ('-created_at',)
    readonly_fields = ('token', 'created_at', 'activated_at', 'is_used', 'user')
    actions = ['activate_accounts', 'reject_accounts']
    
    fieldsets = (
        ('Użytkownik', {
            'fields': ('user',)
        }),
        ('Token', {
            'fields': ('token', 'created_at', 'activated_at', 'is_used')
        }),
    )
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_user_name.short_description = 'Imię i nazwisko'
    get_user_name.admin_order_field = 'user__last_name'
    
    def get_user_email(self, obj):
        return obj.user.email
    get_user_email.short_description = 'Email'
    get_user_email.admin_order_field = 'user__email'
    
    def get_status(self, obj):
        if obj.is_used:
            return format_html('<span style="color: green;">✓ Aktywowany</span>')
        elif obj.is_expired:
            return format_html('<span style="color: red;">✗ Wygasł</span>')
        else:
            return format_html('<span style="color: orange;">⏳ Oczekuje</span>')
    get_status.short_description = 'Status'
    
    def activate_accounts(self, request, queryset):
        """Admin action to activate selected user accounts."""
        activated_count = 0
        
        for token in queryset.filter(is_used=False):
            user = token.user
            user.is_active = True
            user.save()
            token.activate()
            activated_count += 1
        
        self.message_user(
            request, 
            f'Aktywowano {activated_count} kont(o/a)',
            messages.SUCCESS
        )
    activate_accounts.short_description = "✓ Aktywuj wybrane konta"
    
    def reject_accounts(self, request, queryset):
        """Admin action to reject (delete) selected user accounts."""
        rejected_count = 0
        
        for token in queryset.filter(is_used=False):
            user = token.user
            username = f"{user.first_name} {user.last_name}"
            token.delete()
            user.delete()
            rejected_count += 1
        
        self.message_user(
            request,
            f'Odrzucono {rejected_count} kont(o/a)',
            messages.WARNING
        )
    reject_accounts.short_description = "✗ Odrzuć wybrane konta"
