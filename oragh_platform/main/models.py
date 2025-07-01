from django.db import models
from django.contrib.auth.models import User
from django.contrib import admin

INSTRUMENT_CHOICES = [
    ("flet", "Flet"),
    ("klarnet", "Klarnet"),
    ("obój", "Obój"),
    ("saksofon", "Saksofon"),
    ("waltornia", "Waltornia"),
    ("eufonium", "Eufonium"),
    ("trąbka", "Trąbka"),
    ("puzon", "Puzon"),
    ("tuba", "Tuba"),
    ("fagot", "Fagot"),
    ("gitara", "Gitara"),
    ("perkusja", "Perkusja"),
]

class MusicianProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    instrument = models.CharField(max_length=20, choices=INSTRUMENT_CHOICES)
    birthday = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.instrument}"
    
@admin.register(MusicianProfile)
class MusicianProfileAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'instrument')

    def first_name(self, obj):
        return obj.user.first_name
    first_name.short_description = 'Imię'

    def last_name(self, obj):
        return obj.user.last_name
    last_name.short_description = 'Nazwisko'

    def instrument(self, obj):
        return obj.instrument
    instrument.short_description = 'Instrument'