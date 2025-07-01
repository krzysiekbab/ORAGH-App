from django import forms
from django.contrib.auth.models import User
from .models import MusicianProfile

class UserProfileForm(forms.ModelForm):
    first_name = forms.CharField(max_length=30, required=True, label="Imię")
    last_name = forms.CharField(max_length=30, required=True, label="Nazwisko")
    email = forms.EmailField(required=True, label="Email")
    instrument = forms.ChoiceField(choices=MusicianProfile._meta.get_field('instrument').choices, required=True, label="Instrument")
    birthday = forms.DateField(
        required=True,
        widget=forms.DateInput(attrs={'type': 'date'}),
        label="Data urodzenia"
    )
    photo = forms.ImageField(required=False, label="Zdjęcie profilowe")

    class Meta:
        model = MusicianProfile
        fields = ['first_name', 'last_name', 'email', 'instrument', 'birthday', 'photo']

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if user:
            self.fields['first_name'].initial = user.first_name
            self.fields['last_name'].initial = user.last_name
            self.fields['email'].initial = user.email
        # Only set initial if not bound (GET, not POST)
        if not self.is_bound and self.instance and self.instance.birthday:
            self.fields['birthday'].initial = self.instance.birthday.strftime('%Y-%m-%d')

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
