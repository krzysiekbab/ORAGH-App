from django.db import models
from django.conf import settings

class Event(models.Model):
    EVENT_TYPES = [
        ('concert', 'Koncert'),
        ('rehearsal', 'Próba'),
        ('soundcheck', 'Soundcheck'),
    ]
    name = models.CharField(max_length=255)
    date = models.DateField()
    type = models.CharField(max_length=20, choices=EVENT_TYPES)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()}) - {self.date}"

class Attendance(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    present = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'event')
