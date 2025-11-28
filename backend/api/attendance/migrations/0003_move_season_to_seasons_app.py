# Generated migration for attendance app - move Season to seasons app

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0002_alter_season_is_active'),
        ('seasons', '0001_initial'),
    ]

    operations = [
        # Update the ForeignKey to point to seasons.Season
        migrations.AlterField(
            model_name='event',
            name='season',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='events',
                to='seasons.season'
            ),
        ),
        # Remove the old Season model
        migrations.DeleteModel(
            name='Season',
        ),
    ]
