from django import forms
from .models import Concert
from django_ckeditor_5.widgets import CKEditor5Widget

class ConcertForm(forms.ModelForm):
    class Meta:
        model = Concert
        fields = ['name', 'date', 'description', 'setlist']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'date': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'description': CKEditor5Widget(config_name='advanced'),
            'setlist': CKEditor5Widget(config_name='advanced'),
        }
