"""
Management command to assign users to groups easily.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group


class Command(BaseCommand):
    help = 'Assign users to groups'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to assign to group')
        parser.add_argument('group', type=str, choices=['musician', 'board', 'conductor'], 
                          help='Group to assign user to')
        parser.add_argument('--remove', action='store_true', 
                          help='Remove user from group instead of adding')

    def handle(self, *args, **options):
        username = options['username']
        group_name = options['group']
        remove = options['remove']
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ User "{username}" does not exist')
            )
            return
        
        try:
            group = Group.objects.get(name=group_name)
        except Group.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Group "{group_name}" does not exist')
            )
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
        
        # Show current user groups
        current_groups = [g.name for g in user.groups.all()]
        self.stdout.write(f'📁 {username} current groups: {current_groups}')
