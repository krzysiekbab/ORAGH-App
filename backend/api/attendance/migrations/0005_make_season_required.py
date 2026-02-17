# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0004_alter_attendance_options_alter_event_options'),
        ('seasons', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='event',
            name='season',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='events',
                to='seasons.season',
            ),
        ),
    ]
