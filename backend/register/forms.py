from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from main.models import INSTRUMENT_CHOICES

class CustomAuthenticationForm(AuthenticationForm):
    username = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Wprowadź nazwę użytkownika'
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Wprowadź hasło'
        })
    )

class CustomUserCreationForm(UserCreationForm):
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
    username = forms.CharField(
        max_length=150, 
        required=True, 
        label="Nick",
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Wybierz unikalną nazwę użytkownika'
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
        choices=[('', 'Wybierz instrument')] + INSTRUMENT_CHOICES, 
        required=True, 
        label="Instrument",
        widget=forms.Select(attrs={
            'class': 'form-select'
        })
    )
    birthday = forms.DateField(
        required=True, 
        label="Data urodzenia", 
        widget=forms.DateInput(attrs={
            "type": "date",
            'class': 'form-control'
        })
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add Bootstrap classes to password fields
        self.fields['password1'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Wprowadź hasło (min. 8 znaków)'
        })
        self.fields['password2'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Potwierdź hasło'
        })

    class Meta:
        model = User
        fields = ("first_name", "last_name", "email", "password1", "password2", "birthday", "username", "instrument")