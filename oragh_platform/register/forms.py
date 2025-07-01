from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from main.models import INSTRUMENT_CHOICES

class CustomUserCreationForm(UserCreationForm):
    first_name = forms.CharField(max_length=30, required=True, label="Imię")
    last_name = forms.CharField(max_length=30, required=True, label="Nazwisko")
    username = forms.CharField(max_length=150, required=True, label="Nick")
    email = forms.EmailField(required=True, label="Email")
    instrument = forms.ChoiceField(choices=INSTRUMENT_CHOICES, required=True, label="Instrument")
    birthday = forms.DateField(required=True, label="Data urodzenia", widget=forms.DateInput(attrs={"type": "date"}))


    class Meta:
        model = User
        fields = ("first_name", "last_name", "email", "password1", "password2", "birthday", "username", "instrument")