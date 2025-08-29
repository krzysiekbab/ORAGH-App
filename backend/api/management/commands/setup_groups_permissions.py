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
        try:
            user_ct = ContentType.objects.get(app_label='auth', model='user')
            concert_ct = ContentType.objects.get(app_label='concerts', model='concert')
            season_ct = ContentType.objects.get(app_label='attendance', model='season')
            event_ct = ContentType.objects.get(app_label='attendance', model='event')
            attendance_ct = ContentType.objects.get(app_label='attendance', model='attendance')
        except ContentType.DoesNotExist as e:
            self.stdout.write(self.style.ERROR(f'Content type not found: {e}'))
            return
        
        # Helper function to get permission safely
        def get_permission_safe(content_type, codename):
            try:
                return Permission.objects.get(content_type=content_type, codename=codename)
            except Permission.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Permission not found: {content_type.app_label}.{codename}'))
                return None
        
        # === MUSICIAN GROUP PERMISSIONS ===
        musician_permissions = []
        
        # Users - basic permissions
        perm = get_permission_safe(user_ct, 'view_user')
        if perm: musician_permissions.append(perm)
        
        # Concerts - view permissions
        perm = get_permission_safe(concert_ct, 'view_concert')
        if perm: musician_permissions.append(perm)
        
        # Attendance - view permissions
        perm = get_permission_safe(season_ct, 'view_season')
        if perm: musician_permissions.append(perm)
        perm = get_permission_safe(event_ct, 'view_event')
        if perm: musician_permissions.append(perm)
        perm = get_permission_safe(attendance_ct, 'view_attendance')
        if perm: musician_permissions.append(perm)
        
        musician_group.permissions.set(musician_permissions)
        self.stdout.write(f'✅ musician group: {len(musician_permissions)} permissions')
        
        # === BOARD GROUP PERMISSIONS ===
        # Board gets all musician permissions + management permissions
        board_permissions = musician_permissions.copy()
        
        # Users - extended permissions
        perm = get_permission_safe(user_ct, 'add_user')
        if perm: board_permissions.append(perm)
        perm = get_permission_safe(user_ct, 'change_user')
        if perm: board_permissions.append(perm)
        perm = get_permission_safe(user_ct, 'delete_user')
        if perm: board_permissions.append(perm)
        
        # Concerts - full CRUD permissions
        perm = get_permission_safe(concert_ct, 'add_concert')
        if perm: board_permissions.append(perm)
        perm = get_permission_safe(concert_ct, 'change_concert')
        if perm: board_permissions.append(perm)
        perm = get_permission_safe(concert_ct, 'delete_concert')
        if perm: board_permissions.append(perm)
        
        # Attendance - full season management permissions
        perm = get_permission_safe(season_ct, 'add_season')
        if perm: board_permissions.append(perm)
        perm = get_permission_safe(season_ct, 'change_season')
        if perm: board_permissions.append(perm)
        perm = get_permission_safe(season_ct, 'delete_season')
        if perm: board_permissions.append(perm)
        perm = get_permission_safe(season_ct, 'manage_seasons')
        if perm: board_permissions.append(perm)
        
        # Events - full CRUD permissions
        perm = get_permission_safe(event_ct, 'add_event')
        if perm: board_permissions.append(perm)
        perm = get_permission_safe(event_ct, 'change_event')
        if perm: board_permissions.append(perm)
        perm = get_permission_safe(event_ct, 'delete_event')
        if perm: board_permissions.append(perm)
        
        # Attendance records - management permissions
        perm = get_permission_safe(attendance_ct, 'add_attendance')
        if perm: board_permissions.append(perm)
        perm = get_permission_safe(attendance_ct, 'change_attendance')
        if perm: board_permissions.append(perm)
        perm = get_permission_safe(attendance_ct, 'delete_attendance')
        if perm: board_permissions.append(perm)
        
        board_group.permissions.set(board_permissions)
        self.stdout.write(f'✅ board group: {len(board_permissions)} permissions')
        
        # === CONDUCTOR GROUP PERMISSIONS ===
        # Conductor gets all board permissions + additional admin permissions
        conductor_permissions = board_permissions.copy()  # Conductors get same as board for now
        
        conductor_group.permissions.set(conductor_permissions)
        self.stdout.write(f'✅ conductor group: {len(conductor_permissions)} permissions')
        
        self.stdout.write('\n=== PERMISSION SUMMARY ===')
        self.stdout.write('musician: view concerts/attendance, register for concerts')
        self.stdout.write('board: all musician permissions + full management of concerts/seasons/events/attendance')
        self.stdout.write('conductor: all board permissions (extensible for future admin features)')
        
        self.stdout.write(self.style.SUCCESS('\n✅ Groups and permissions set up successfully!'))
        self.stdout.write('\n💡 Now you can assign users to groups in Django Admin')
        self.stdout.write('💡 Board members can create and manage seasons')
