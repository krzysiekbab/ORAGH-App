"""
Management command to set up groups and permissions for the ORAGH platform.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType


class Command(BaseCommand):
    help = 'Set up user groups and permissions for the ORAGH platform'

    def handle(self, *args, **options):
        self.stdout.write('Setting up groups and permissions...')
        
        # Create/get groups
        musician_group, _ = Group.objects.get_or_create(name='musician')
        board_group, _ = Group.objects.get_or_create(name='board')
        conductor_group, _ = Group.objects.get_or_create(name='conductor')
        
        # Clear existing permissions
        musician_group.permissions.clear()
        board_group.permissions.clear()
        conductor_group.permissions.clear()
        
        # Get content types
        user_ct = ContentType.objects.get(app_label='auth', model='user')
        concert_ct = ContentType.objects.get(app_label='concerts', model='concert')
        
        # === MUSICIAN GROUP PERMISSIONS ===
        musician_permissions = [
            # Users - basic permissions
            Permission.objects.get(content_type=user_ct, codename='view_user'),
            
            # Concerts - view and register only
            Permission.objects.get(content_type=concert_ct, codename='view_concert'),
        ]
        
        musician_group.permissions.set(musician_permissions)
        self.stdout.write(f'✅ musician group: {len(musician_permissions)} permissions')
        
        # === BOARD GROUP PERMISSIONS ===
        # Board gets all musician permissions + management permissions
        board_permissions = musician_permissions + [
            # Users - extended permissions
            Permission.objects.get(content_type=user_ct, codename='add_user'),
            Permission.objects.get(content_type=user_ct, codename='change_user'),
            Permission.objects.get(content_type=user_ct, codename='delete_user'),
            
            # Concerts - full CRUD permissions
            Permission.objects.get(content_type=concert_ct, codename='add_concert'),
            Permission.objects.get(content_type=concert_ct, codename='change_concert'),
            Permission.objects.get(content_type=concert_ct, codename='delete_concert'),
        ]
        
        board_group.permissions.set(board_permissions)
        self.stdout.write(f'✅ board group: {len(board_permissions)} permissions')
        
        # === CONDUCTOR GROUP PERMISSIONS ===
        # Conductor gets all board permissions + additional admin permissions
        conductor_permissions = board_permissions  # Conductors get same as board for now
        
        conductor_group.permissions.set(conductor_permissions)
        self.stdout.write(f'✅ conductor group: {len(conductor_permissions)} permissions')
        
        self.stdout.write('\n=== PERMISSION SUMMARY ===')
        self.stdout.write('musician: view concerts, register for concerts')
        self.stdout.write('board: all musician permissions + create/edit/delete concerts')
        self.stdout.write('conductor: all board permissions (extensible for future admin features)')
        
        self.stdout.write(self.style.SUCCESS('\n✅ Groups and permissions set up successfully!'))
        self.stdout.write('\n💡 Now you can assign users to groups in Django Admin')
