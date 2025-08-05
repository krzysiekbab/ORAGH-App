from django import forms
from django_ckeditor_5.widgets import CKEditor5Widget
from .models import Comment, Post, Announcement


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['content']
        widgets = {
            'content': CKEditor5Widget(config_name='advanced')
        }
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['content'].label = "Treść komentarza"


class PostForm(forms.Form):
    title = forms.CharField(
        max_length=200,
        label="Tytuł postu",
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Wprowadź tytuł postu...'
        })
    )
    content = forms.CharField(
        label="Treść postu",
        widget=CKEditor5Widget(config_name='advanced')
    )




class AnnouncementForm(forms.ModelForm):
    PRIORITY_CHOICES = [
        (0, '0 - Normalny'),
        (1, '1 - Podwyższony'),
        (2, '2 - Wysoki'),
        (3, '3 - Bardzo wysoki'),
        (4, '4 - Krytyczny'),
        (5, '5 - Najwyższy'),
    ]
    
    priority = forms.ChoiceField(
        choices=PRIORITY_CHOICES,
        initial=0,
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    
    is_active = forms.BooleanField(
        required=False,
        initial=True,
        label="Aktywne",
        help_text="Czy ogłoszenie ma być wyświetlane na forum",
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )
    
    class Meta:
        model = Announcement
        fields = ['title', 'content', 'priority', 'is_active']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Tytuł ogłoszenia...'
            }),
            'content': CKEditor5Widget(config_name='advanced')
        }
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['title'].label = "Tytuł ogłoszenia"
        self.fields['content'].label = "Treść ogłoszenia"
        self.fields['priority'].label = "Priorytet"
        self.fields['is_active'].label = "Aktywne"
