# Generated by Django 5.2.2 on 2025-07-09 15:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0003_musicianprofile_photo'),
    ]

    operations = [
        migrations.AddField(
            model_name='musicianprofile',
            name='active',
            field=models.BooleanField(default=True),
        ),
    ]
