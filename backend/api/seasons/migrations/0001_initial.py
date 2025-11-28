# Generated migration for seasons app - initial

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '__first__'),
        ('attendance', '0002_alter_season_is_active'),
    ]

    operations = [
        migrations.CreateModel(
            name='Season',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='e.g., 2024/2025', max_length=20, unique=True)),
                ('start_date', models.DateField(help_text='Start date of the season')),
                ('end_date', models.DateField(help_text='End date of the season')),
                ('is_active', models.BooleanField(default=False, help_text='Whether this season is currently active')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('musicians', models.ManyToManyField(blank=True, related_name='seasons', to='users.musicianprofile')),
            ],
            options={
                'verbose_name': 'Sezon',
                'verbose_name_plural': 'Sezony',
                'db_table': 'seasons_season',
                'ordering': ['-start_date'],
                'permissions': [('manage_seasons', 'Can manage seasons')],
            },
        ),
        # Copy data from attendance_season to seasons_season
        migrations.RunSQL(
            sql="""
                INSERT INTO seasons_season (id, name, start_date, end_date, is_active, created_at, updated_at)
                SELECT id, name, start_date, end_date, is_active, created_at, updated_at
                FROM attendance_season;
            """,
            reverse_sql="""
                INSERT INTO attendance_season (id, name, start_date, end_date, is_active, created_at, updated_at)
                SELECT id, name, start_date, end_date, is_active, created_at, updated_at
                FROM seasons_season;
            """
        ),
        # Copy many-to-many relationships
        migrations.RunSQL(
            sql="""
                INSERT INTO seasons_season_musicians (id, season_id, musicianprofile_id)
                SELECT id, season_id, musicianprofile_id
                FROM attendance_season_musicians;
            """,
            reverse_sql="""
                INSERT INTO attendance_season_musicians (id, season_id, musicianprofile_id)
                SELECT id, season_id, musicianprofile_id
                FROM seasons_season_musicians;
            """
        ),
    ]
