"""
Django signals for handling file cleanup in the users app.
"""
import os
from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from .models import MusicianProfile


@receiver(pre_save, sender=MusicianProfile)
def delete_old_photo_on_update(sender, instance, **kwargs):
    """
    Delete the old photo when a new photo is uploaded.
    This signal is triggered before saving the model.
    """
    if not instance.pk:
        # This is a new instance, no old photo to delete
        return
    
    try:
        # Get the current instance from the database
        old_instance = MusicianProfile.objects.get(pk=instance.pk)
        
        # Check if the photo field has changed
        if old_instance.photo and old_instance.photo != instance.photo:
            old_photo_path = old_instance.photo.path
            if os.path.exists(old_photo_path):
                try:
                    os.remove(old_photo_path)
                    print(f"Deleted old photo: {old_photo_path}")
                except OSError as e:
                    print(f"Error deleting old photo {old_photo_path}: {e}")
    except MusicianProfile.DoesNotExist:
        # Old instance doesn't exist, nothing to delete
        pass


@receiver(post_delete, sender=MusicianProfile)
def delete_photo_on_profile_delete(sender, instance, **kwargs):
    """
    Delete the photo file when the musician profile is deleted.
    """
    if instance.photo:
        photo_path = instance.photo.path
        if os.path.exists(photo_path):
            try:
                os.remove(photo_path)
                print(f"Deleted photo on profile deletion: {photo_path}")
            except OSError as e:
                print(f"Error deleting photo on profile deletion {photo_path}: {e}")
