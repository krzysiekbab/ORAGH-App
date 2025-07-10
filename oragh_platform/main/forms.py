from django import forms
from django.contrib.auth.models import User
from .models import MusicianProfile, INSTRUMENT_CHOICES

class UserProfileForm(forms.ModelForm):
    first_name = forms.CharField(
        max_length=30, 
        required=True, 
        label="Imię",
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Wprowadź swoje imię'
        })
    )
    last_name = forms.CharField(
        max_length=30, 
        required=True, 
        label="Nazwisko",
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Wprowadź swoje nazwisko'
        })
    )
    email = forms.EmailField(
        required=True, 
        label="Email",
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'twoj@email.com'
        })
    )
    instrument = forms.ChoiceField(
        choices=INSTRUMENT_CHOICES, 
        required=True, 
        label="Instrument",
        widget=forms.Select(attrs={
            'class': 'form-select'
        })
    )
    photo = forms.ImageField(
        required=False, 
        label="Zdjęcie profilowe",
        widget=forms.FileInput(attrs={
            'class': 'form-control',
            'accept': 'image/*'
        })
    )

    class Meta:
        model = MusicianProfile
        fields = ['first_name', 'last_name', 'email', 'instrument', 'photo']

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if user:
            self.fields['first_name'].initial = user.first_name
            self.fields['last_name'].initial = user.last_name
            self.fields['email'].initial = user.email

    def save(self, commit=True, user=None):
        profile = super().save(commit=False)
        if user:
            user.first_name = self.cleaned_data['first_name']
            user.last_name = self.cleaned_data['last_name']
            user.email = self.cleaned_data['email']
            if commit:
                user.save()
        if commit:
            profile.user = user
            profile.save()
            self.save_m2m()
        return profile
