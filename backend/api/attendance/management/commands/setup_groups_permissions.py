"""
Management command to set up groups and permissions for the ORAGH platform.
Enhanced version with comprehensive board permissions for attendance management.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType


class Command(BaseCommand):
    help = 'Set up user groups and permissions for the ORAGH platform'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset all permissions before setting up new ones',
        )

    def handle(self, *args, **options):
        self.stdout.write('🎼 Setting up ORAGH groups and permissions...')
        
        # Create/get groups
        musician_group, created = Group.objects.get_or_create(name='musician')
        board_group, created = Group.objects.get_or_create(name='board')
        conductor_group, created = Group.objects.get_or_create(name='conductor')
        
        if options['reset']:
            self.stdout.write('🔄 Resetting all group permissions...')
            musician_group.permissions.clear()
            board_group.permissions.clear()
            conductor_group.permissions.clear()
        
        # Get content types
        content_types = {}
        required_content_types = [
            ('auth', 'user'),
            ('concerts', 'concert'),
            ('attendance', 'season'),
            ('attendance', 'event'),
            ('attendance', 'attendance'),
            ('forum', 'directory'),
            ('forum', 'post'),
            ('forum', 'comment'),
        ]
        
        for app_label, model_name in required_content_types:
            try:
                content_types[f'{app_label}_{model_name}'] = ContentType.objects.get(
                    app_label=app_label, model=model_name
                )
            except ContentType.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  Content type not found: {app_label}.{model_name}')
                )
        
        # Helper function to get permission safely
        def get_permission_safe(content_type, codename):
            try:
                return Permission.objects.get(content_type=content_type, codename=codename)
            except Permission.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  Permission not found: {content_type.app_label}.{codename}')
                )
                return None
        
        def add_permissions_to_group(group, permissions_list, description):
            """Helper to add permissions to a group and show progress"""
            valid_permissions = [p for p in permissions_list if p is not None]
            group.permissions.add(*valid_permissions)
            self.stdout.write(f'✅ {group.name} group: {len(valid_permissions)} permissions ({description})')
            return valid_permissions
        
        # === MUSICIAN GROUP PERMISSIONS ===
        musician_permissions = []
        
        # Users - basic view permissions
        if 'auth_user' in content_types:
            perm = get_permission_safe(content_types['auth_user'], 'view_user')
            if perm: musician_permissions.append(perm)
        
        # Concerts - view permissions
        if 'concerts_concert' in content_types:
            perm = get_permission_safe(content_types['concerts_concert'], 'view_concert')
            if perm: musician_permissions.append(perm)
        
        # Attendance - view permissions only
        if 'attendance_season' in content_types:
            perm = get_permission_safe(content_types['attendance_season'], 'view_season')
            if perm: musician_permissions.append(perm)
            
        if 'attendance_event' in content_types:
            perm = get_permission_safe(content_types['attendance_event'], 'view_event')
            if perm: musician_permissions.append(perm)
            
        if 'attendance_attendance' in content_types:
            perm = get_permission_safe(content_types['attendance_attendance'], 'view_attendance')
            if perm: musician_permissions.append(perm)
        
        # Forum - basic permissions for musicians
        if 'forum_directory' in content_types:
            perm = get_permission_safe(content_types['forum_directory'], 'view_directory')
            if perm: musician_permissions.append(perm)
            
        if 'forum_post' in content_types:
            perm = get_permission_safe(content_types['forum_post'], 'view_post')
            if perm: musician_permissions.append(perm)
            perm = get_permission_safe(content_types['forum_post'], 'add_post')
            if perm: musician_permissions.append(perm)
            perm = get_permission_safe(content_types['forum_post'], 'change_post')
            if perm: musician_permissions.append(perm)
            perm = get_permission_safe(content_types['forum_post'], 'delete_post')
            if perm: musician_permissions.append(perm)
            
        if 'forum_comment' in content_types:
            perm = get_permission_safe(content_types['forum_comment'], 'view_comment')
            if perm: musician_permissions.append(perm)
            perm = get_permission_safe(content_types['forum_comment'], 'add_comment')
            if perm: musician_permissions.append(perm)
            perm = get_permission_safe(content_types['forum_comment'], 'change_comment')
            if perm: musician_permissions.append(perm)
            perm = get_permission_safe(content_types['forum_comment'], 'delete_comment')
            if perm: musician_permissions.append(perm)
        
        add_permissions_to_group(musician_group, musician_permissions, 'view access')
        
        # === BOARD GROUP PERMISSIONS ===
        # Board gets all musician permissions + comprehensive management permissions
        board_permissions = musician_permissions.copy()
        
        # Users - full user management permissions
        if 'auth_user' in content_types:
            user_perms = ['add_user', 'change_user', 'delete_user']
            for perm_name in user_perms:
                perm = get_permission_safe(content_types['auth_user'], perm_name)
                if perm: board_permissions.append(perm)
        
        # Concerts - full CRUD permissions
        if 'concerts_concert' in content_types:
            concert_perms = ['add_concert', 'change_concert', 'delete_concert']
            for perm_name in concert_perms:
                perm = get_permission_safe(content_types['concerts_concert'], perm_name)
                if perm: board_permissions.append(perm)
        
        # ATTENDANCE SYSTEM - FULL MANAGEMENT PERMISSIONS
        
        # Seasons - complete season management
        if 'attendance_season' in content_types:
            season_perms = ['add_season', 'change_season', 'delete_season', 'manage_seasons']
            for perm_name in season_perms:
                perm = get_permission_safe(content_types['attendance_season'], perm_name)
                if perm: board_permissions.append(perm)
        
        # Events - complete event management
        if 'attendance_event' in content_types:
            event_perms = ['add_event', 'change_event', 'delete_event']
            for perm_name in event_perms:
                perm = get_permission_safe(content_types['attendance_event'], perm_name)
                if perm: board_permissions.append(perm)
        
        # Attendance records - complete attendance management
        if 'attendance_attendance' in content_types:
            attendance_perms = ['add_attendance', 'change_attendance', 'delete_attendance']
            for perm_name in attendance_perms:
                perm = get_permission_safe(content_types['attendance_attendance'], perm_name)
                if perm: board_permissions.append(perm)
        
        # FORUM SYSTEM - FULL MANAGEMENT PERMISSIONS
        
        # Directories - complete directory management (board only)
        if 'forum_directory' in content_types:
            directory_perms = ['add_directory', 'change_directory', 'delete_directory', 
                             'can_create_directory', 'can_manage_directories']
            for perm_name in directory_perms:
                perm = get_permission_safe(content_types['forum_directory'], perm_name)
                if perm: board_permissions.append(perm)
        
        # Posts - moderation permissions
        if 'forum_post' in content_types:
            post_perms = ['can_pin_posts', 'can_lock_posts', 'can_moderate_posts']
            for perm_name in post_perms:
                perm = get_permission_safe(content_types['forum_post'], perm_name)
                if perm: board_permissions.append(perm)
        
        # Comments - moderation permissions
        if 'forum_comment' in content_types:
            comment_perms = ['can_moderate_comments']
            for perm_name in comment_perms:
                perm = get_permission_safe(content_types['forum_comment'], perm_name)
                if perm: board_permissions.append(perm)
        
        add_permissions_to_group(board_group, board_permissions, 'full management access')
        
        # === CONDUCTOR GROUP PERMISSIONS ===
        # Conductor gets all board permissions + potential future admin features
        conductor_permissions = board_permissions.copy()
        
        add_permissions_to_group(conductor_group, conductor_permissions, 'comprehensive access')
        
        # Show detailed summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write('📊 PERMISSION SUMMARY')
        self.stdout.write('='*50)
        
        self.stdout.write('🎵 MUSICIAN GROUP:')
        self.stdout.write('   • View users, concerts, seasons, events, attendance')
        self.stdout.write('   • Read-only access to attendance system')
        self.stdout.write('   • 💬 FORUM ACCESS:')
        self.stdout.write('     - View forum directories and posts')
        self.stdout.write('     - Create/edit/delete own posts and comments')
        
        self.stdout.write('\n🏛️  BOARD GROUP:')
        self.stdout.write('   • All musician permissions')
        self.stdout.write('   • Full user management (add/edit/delete)')
        self.stdout.write('   • Full concert management (add/edit/delete)')
        self.stdout.write('   • ✨ COMPLETE ATTENDANCE SYSTEM MANAGEMENT:')
        self.stdout.write('     - Create/edit/delete seasons')
        self.stdout.write('     - Manage season activation')
        self.stdout.write('     - Create/edit/delete events')
        self.stdout.write('     - Add/edit/delete attendance records')
        self.stdout.write('     - Full access to attendance data')
        self.stdout.write('   • 🏛️  COMPLETE FORUM MANAGEMENT:')
        self.stdout.write('     - Create/edit/delete forum directories')
        self.stdout.write('     - Pin/lock posts and moderate content')
        self.stdout.write('     - Full moderation of posts and comments')
        
        self.stdout.write('\n🎼 CONDUCTOR GROUP:')
        self.stdout.write('   • All board permissions')
        self.stdout.write('   • Full forum and attendance management')
        self.stdout.write('   • Extensible for future admin features')
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('✅ Groups and permissions configured successfully!'))
        self.stdout.write('\n💡 Next steps:')
        self.stdout.write('   1. Assign users to groups using Django Admin or manage.py assign_user_group')
        self.stdout.write('   2. Board members can now fully manage the attendance system and forum')
        self.stdout.write('   3. Access Django admin at /admin to manage attendance and forum models')
        
        # Show group membership suggestions
        self.stdout.write('\n📝 Group Assignment Suggestions:')
        self.stdout.write('   • musician: Regular orchestra members')
        self.stdout.write('   • board: Board members who manage attendance/events/seasons')
        self.stdout.write('   • conductor: Conductors with full system access')
