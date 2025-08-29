"""
Enhanced management command to assign users to groups with better functionality.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group


class Command(BaseCommand):
    help = 'Assign users to groups with enhanced functionality'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, nargs='?', help='Username to assign to group')
        parser.add_argument('group', type=str, nargs='?', choices=['musician', 'board', 'conductor'], 
                          help='Group to assign user to')
        parser.add_argument('--remove', action='store_true', 
                          help='Remove user from group instead of adding')
        parser.add_argument('--list-users', action='store_true',
                          help='List all users and their groups')
        parser.add_argument('--list-groups', action='store_true',
                          help='List all groups and their permissions count')

    def handle(self, *args, **options):
        # Handle special listing options
        if options['list_users']:
            self.list_users()
            return
            
        if options['list_groups']:
            self.list_groups()
            return
        
        username = options['username']
        group_name = options['group']
        
        # Check if required arguments are provided
        if not username or not group_name:
            self.stdout.write(
                self.style.ERROR('❌ Both username and group are required when not using list options')
            )
            self.stdout.write('\nUsage examples:')
            self.stdout.write('  python manage.py assign_user_group admin conductor')
            self.stdout.write('  python manage.py assign_user_group --list-users')
            self.stdout.write('  python manage.py assign_user_group --list-groups')
            return
        
        remove = options['remove']
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ User "{username}" does not exist')
            )
            self.list_available_users()
            return
        
        try:
            group = Group.objects.get(name=group_name)
        except Group.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Group "{group_name}" does not exist')
            )
            self.stdout.write('Available groups: musician, board, conductor')
            return
        
        if remove:
            if user.groups.filter(name=group_name).exists():
                user.groups.remove(group)
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Removed {username} from {group_name} group')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  {username} is not in {group_name} group')
                )
        else:
            if user.groups.filter(name=group_name).exists():
                self.stdout.write(
                    self.style.WARNING(f'⚠️  {username} is already in {group_name} group')
                )
            else:
                user.groups.add(group)
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Added {username} to {group_name} group')
                )
        
        # Show current user groups and permissions summary
        self.show_user_details(user)
    
    def list_users(self):
        """List all users and their group memberships"""
        self.stdout.write('👥 USER GROUP MEMBERSHIPS')
        self.stdout.write('=' * 50)
        
        users = User.objects.all().order_by('username')
        for user in users:
            groups = [g.name for g in user.groups.all()]
            name_display = f'{user.first_name} {user.last_name}'.strip() or 'No name'
            groups_display = ', '.join(groups) if groups else 'No groups'
            self.stdout.write(f'{user.username:15} | {name_display:20} | {groups_display}')
    
    def list_groups(self):
        """List all groups and their permission counts"""
        self.stdout.write('🏛️  GROUP PERMISSIONS SUMMARY')
        self.stdout.write('=' * 50)
        
        groups = Group.objects.all().order_by('name')
        for group in groups:
            perm_count = group.permissions.count()
            member_count = group.user_set.count()
            self.stdout.write(f'{group.name:12} | {perm_count:2} permissions | {member_count:2} members')
    
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
        self.stdout.write('-' * 30)
        
        name_display = f'{user.first_name} {user.last_name}'.strip()
        if name_display:
            self.stdout.write(f'Name: {name_display}')
        
        if current_groups:
            self.stdout.write(f'Groups: {", ".join(current_groups)}')
            
            # Show what permissions this user has
            all_permissions = set()
            for group in user.groups.all():
                group_perms = group.permissions.all()
                all_permissions.update(group_perms)
            
            # Group permissions by app
            perms_by_app = {}
            for perm in all_permissions:
                app = perm.content_type.app_label
                if app not in perms_by_app:
                    perms_by_app[app] = []
                perms_by_app[app].append(perm.codename)
            
            self.stdout.write('Permissions:')
            for app, perms in sorted(perms_by_app.items()):
                self.stdout.write(f'  {app}: {len(perms)} permissions')
                
        else:
            self.stdout.write('Groups: None')
            self.stdout.write('Permissions: None')
        
        # Show access level
        if 'conductor' in current_groups:
            self.stdout.write('🎼 Access Level: CONDUCTOR (Full system access)')
        elif 'board' in current_groups:
            self.stdout.write('🏛️  Access Level: BOARD (Management access)')
        elif 'musician' in current_groups:
            self.stdout.write('🎵 Access Level: MUSICIAN (View access)')
        else:
            self.stdout.write('⚠️  Access Level: LIMITED (No group permissions)')
