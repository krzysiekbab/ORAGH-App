"""
Enhanced management command to manage user groups with listing capabilities.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group


class Command(BaseCommand):
    help = 'Manage user groups with enhanced functionality'

    def add_arguments(self, parser):
        parser.add_argument('--list-users', action='store_true',
                          help='List all users and their groups')
        parser.add_argument('--list-groups', action='store_true',
                          help='List all groups and their permissions count')
        parser.add_argument('--user', type=str, help='Username to manage')
        parser.add_argument('--add-to', type=str, choices=['musician', 'board'],
                          help='Add user to specified group')
        parser.add_argument('--remove-from', type=str, choices=['musician', 'board'],
                          help='Remove user from specified group')

    def handle(self, *args, **options):
        # Handle listing options
        if options['list_users']:
            self.list_users()
            return
            
        if options['list_groups']:
            self.list_groups()
            return
        
        # Handle user management
        if options['user']:
            user = self.get_user(options['user'])
            if not user:
                return
                
            if options['add_to']:
                self.add_user_to_group(user, options['add_to'])
            elif options['remove_from']:
                self.remove_user_from_group(user, options['remove_from'])
            else:
                self.show_user_details(user)
        else:
            self.stdout.write('Use --list-users, --list-groups, or --user <username>')
    
    def get_user(self, username):
        """Get user by username"""
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ User "{username}" does not exist')
            )
            self.list_available_users()
            return None
    
    def add_user_to_group(self, user, group_name):
        """Add user to group"""
        try:
            group = Group.objects.get(name=group_name)
        except Group.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Group "{group_name}" does not exist')
            )
            return
        
        if user.groups.filter(name=group_name).exists():
            self.stdout.write(
                self.style.WARNING(f'⚠️  {user.username} is already in {group_name} group')
            )
        else:
            user.groups.add(group)
            self.stdout.write(
                self.style.SUCCESS(f'✅ Added {user.username} to {group_name} group')
            )
        
        self.show_user_details(user)
    
    def remove_user_from_group(self, user, group_name):
        """Remove user from group"""
        try:
            group = Group.objects.get(name=group_name)
        except Group.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Group "{group_name}" does not exist')
            )
            return
        
        if user.groups.filter(name=group_name).exists():
            user.groups.remove(group)
            self.stdout.write(
                self.style.SUCCESS(f'✅ Removed {user.username} from {group_name} group')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'⚠️  {user.username} is not in {group_name} group')
            )
        
        self.show_user_details(user)
    
    def list_users(self):
        """List all users and their group memberships"""
        self.stdout.write('👥 USER GROUP MEMBERSHIPS')
        self.stdout.write('=' * 70)
        
        users = User.objects.all().order_by('username')
        for user in users:
            groups = [g.name for g in user.groups.all()]
            name_display = f'{user.first_name} {user.last_name}'.strip() or 'No name'
            groups_display = ', '.join(groups) if groups else 'No groups'
            
            # Add access level indicator
            access_level = '🏛️' if 'board' in groups else '🎵' if 'musician' in groups else '⚠️'
            
            self.stdout.write(f'{access_level} {user.username:15} | {name_display:20} | {groups_display}')
    
    def list_groups(self):
        """List all groups and their permission counts"""
        self.stdout.write('🏛️  GROUP PERMISSIONS SUMMARY')
        self.stdout.write('=' * 60)
        
        groups = Group.objects.all().order_by('name')
        for group in groups:
            perm_count = group.permissions.count()
            member_count = group.user_set.count()
            
            # Show key permissions for attendance system
            attendance_perms = group.permissions.filter(content_type__app_label='attendance').count()
            
            self.stdout.write(
                f'{group.name:12} | {perm_count:2} total perms | {attendance_perms:2} attendance perms | {member_count:2} members'
            )
        
        self.stdout.write('\n📋 Permission Details:')
        self.stdout.write('• musician: View-only access to attendance system')
        self.stdout.write('• board: Full CRUD access to seasons/events/attendance')
    
    def list_available_users(self):
        """Show available users when username not found"""
        self.stdout.write('\n💡 Available users:')
        users = User.objects.all().order_by('username')
        for user in users:
            name_display = f'{user.first_name} {user.last_name}'.strip()
            if name_display:
                self.stdout.write(f'  • {user.username} ({name_display})')
            else:
                self.stdout.write(f'  • {user.username}')
    
    def show_user_details(self, user):
        """Show detailed information about user's groups and permissions"""
        current_groups = [g.name for g in user.groups.all()]
        self.stdout.write(f'\n👤 USER DETAILS: {user.username}')
        self.stdout.write('-' * 40)
        
        name_display = f'{user.first_name} {user.last_name}'.strip()
        if name_display:
            self.stdout.write(f'📝 Name: {name_display}')
        
        if current_groups:
            self.stdout.write(f'👥 Groups: {", ".join(current_groups)}')
            
            # Show attendance permissions specifically
            attendance_permissions = set()
            for group in user.groups.all():
                group_perms = group.permissions.filter(content_type__app_label='attendance')
                attendance_permissions.update([p.codename for p in group_perms])
            
            if attendance_permissions:
                self.stdout.write(f'🎼 Attendance Permissions: {len(attendance_permissions)}')
                if 'manage_seasons' in attendance_permissions:
                    self.stdout.write('   ✅ Can manage seasons')
                if 'add_event' in attendance_permissions:
                    self.stdout.write('   ✅ Can create events')
                if 'change_attendance' in attendance_permissions:
                    self.stdout.write('   ✅ Can edit attendance records')
                    
        else:
            self.stdout.write('👥 Groups: None')
            self.stdout.write('🎼 Attendance Permissions: None')
        
        # Show access level summary
        if 'board' in current_groups:
            self.stdout.write('🏛️  Access Level: BOARD (Full attendance management)')
        elif 'musician' in current_groups:
            self.stdout.write('🎵 Access Level: MUSICIAN (View attendance only)')
        else:
            self.stdout.write('⚠️  Access Level: LIMITED (No group permissions)')
