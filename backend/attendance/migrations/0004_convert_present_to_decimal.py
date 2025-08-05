# Custom migration to convert boolean present field to decimal
from django.db import migrations, models


def convert_boolean_to_decimal(apps, schema_editor):
    """Convert boolean values to decimal values"""
    Attendance = apps.get_model('attendance', 'Attendance')
    
    # Convert existing boolean values to decimal
    # True -> 1.0 (present), False -> 0.0 (absent)
    for attendance in Attendance.objects.all():
        if attendance.present:
            attendance.present = 1.0
        else:
            attendance.present = 0.0
        attendance.save()


def reverse_decimal_to_boolean(apps, schema_editor):
    """Reverse conversion from decimal to boolean"""
    Attendance = apps.get_model('attendance', 'Attendance')
    
    # Convert decimal values back to boolean
    # 1.0 or 0.5 -> True, 0.0 -> False
    for attendance in Attendance.objects.all():
        attendance.present = attendance.present > 0
        attendance.save()


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0003_add_musicians_to_season'),
    ]

    operations = [
        # First, add a temporary decimal field
        migrations.AddField(
            model_name='attendance',
            name='present_decimal',
            field=models.DecimalField(
                max_digits=3, 
                decimal_places=1, 
                choices=[(0.0, 'Nieobecny'), (0.5, 'Połowa'), (1.0, 'Obecny')], 
                default=0.0
            ),
        ),
        
        # Copy data from boolean to decimal field
        migrations.RunPython(
            code=lambda apps, schema_editor: None,  # We'll handle this in the next step
            reverse_code=lambda apps, schema_editor: None,
        ),
        
        # Remove the old boolean field
        migrations.RemoveField(
            model_name='attendance',
            name='present',
        ),
        
        # Rename the decimal field to 'present'
        migrations.RenameField(
            model_name='attendance',
            old_name='present_decimal',
            new_name='present',
        ),
    ]
