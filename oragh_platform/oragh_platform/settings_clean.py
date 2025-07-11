# Copy of just the CKEDITOR config section to verify syntax
CKEDITOR_5_CONFIGS = {
    'default': {
        'toolbar': ['heading', '|', 'bold', 'italic', 'link',
                    'bulletedList', 'numberedList', 'blockQuote'],
    },
    'forum': {
        'toolbar': [
            'heading', '|',
            'bold', 'italic', 'underline', '|',
            'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
            'numberedList', 'bulletedList', '|',
            'link', 'blockQuote', '|',
            'insertTable', '|',
            'specialCharacters', '|',
            'undo', 'redo'
        ],
        'heading': {
            'options': [
                { 'model': 'paragraph', 'title': 'Paragraph', 'class': 'ck-heading_paragraph' },
                { 'model': 'heading1', 'view': 'h1', 'title': 'Heading 1', 'class': 'ck-heading_heading1' },
                { 'model': 'heading2', 'view': 'h2', 'title': 'Heading 2', 'class': 'ck-heading_heading2' },
                { 'model': 'heading3', 'view': 'h3', 'title': 'Heading 3', 'class': 'ck-heading_heading3' },
                { 'model': 'heading4', 'view': 'h4', 'title': 'Heading 4', 'class': 'ck-heading_heading4' }
            ]
        },
        'fontSize': {
            'options': ['tiny', 'small', 'default', 'big', 'huge']
        },
        'fontFamily': {
            'options': [
                'default',
                'Arial, Helvetica, sans-serif',
                'Courier New, Courier, monospace',
                'Georgia, serif',
                'Lucida Sans Unicode, Lucida Grande, sans-serif',
                'Tahoma, Geneva, sans-serif',
                'Times New Roman, Times, serif',
                'Trebuchet MS, Helvetica, sans-serif',
                'Verdana, Geneva, sans-serif'
            ]
        },
        'fontColor': {
            'colors': [
                {'color': 'hsl(0, 0%, 0%)', 'label': 'Black'},
                {'color': 'hsl(0, 0%, 30%)', 'label': 'Dim grey'},
                {'color': 'hsl(0, 0%, 60%)', 'label': 'Grey'},
                {'color': 'hsl(0, 0%, 90%)', 'label': 'Light grey'},
                {'color': 'hsl(0, 0%, 100%)', 'label': 'White', 'hasBorder': True},
                {'color': 'hsl(0, 75%, 60%)', 'label': 'Red'},
                {'color': 'hsl(30, 75%, 60%)', 'label': 'Orange'},
                {'color': 'hsl(60, 75%, 60%)', 'label': 'Yellow'},
                {'color': 'hsl(90, 75%, 60%)', 'label': 'Light green'},
                {'color': 'hsl(120, 75%, 60%)', 'label': 'Green'},
                {'color': 'hsl(150, 75%, 60%)', 'label': 'Aquamarine'},
                {'color': 'hsl(180, 75%, 60%)', 'label': 'Turquoise'},
                {'color': 'hsl(210, 75%, 60%)', 'label': 'Light blue'},
                {'color': 'hsl(240, 75%, 60%)', 'label': 'Blue'},
                {'color': 'hsl(270, 75%, 60%)', 'label': 'Purple'},
            ]
        },
        'fontBackgroundColor': {
            'colors': [
                {'color': 'hsl(0, 75%, 60%)', 'label': 'Red'},
                {'color': 'hsl(30, 75%, 60%)', 'label': 'Orange'},
                {'color': 'hsl(60, 75%, 60%)', 'label': 'Yellow'},
                {'color': 'hsl(90, 75%, 60%)', 'label': 'Light green'},
                {'color': 'hsl(120, 75%, 60%)', 'label': 'Green'},
                {'color': 'hsl(150, 75%, 60%)', 'label': 'Aquamarine'},
                {'color': 'hsl(180, 75%, 60%)', 'label': 'Turquoise'},
                {'color': 'hsl(210, 75%, 60%)', 'label': 'Light blue'},
                {'color': 'hsl(240, 75%, 60%)', 'label': 'Blue'},
                {'color': 'hsl(270, 75%, 60%)', 'label': 'Purple'},
            ]
        },
        'alignment': {
            'options': ['left', 'center', 'right', 'justify']
        },
        'table': {
            'contentToolbar': ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
        },
        'specialCharacters': {
            'options': [
                {'title': 'Arrows', 'items': ['←', '↑', '→', '↓', '↔', '↕', '↖', '↗', '↘', '↙', '↺', '↻']},
                {'title': 'Mathematical', 'items': ['±', '×', '÷', '=', '≠', '≤', '≥', '∞', '∑', '∏', '∆', '√', '∂', '∫', '≈', '≡', '∝', '∴', '∵', '∈', '∉', '⊂', '⊃', '⊄', '⊅', '∩', '∪']},
                {'title': 'Currency', 'items': ['$', '€', '£', '¥', '₹', '₽', '₩', '₪', '₴', '₦', '₡', '₨', '₵', '₸', '₼', '₺']},
                {'title': 'Latin', 'items': ['Á', 'À', 'Ă', 'Â', 'Å', 'Ä', 'Ã', 'Ą', 'Ā', 'á', 'à', 'ă', 'â', 'å', 'ä', 'ã', 'ą', 'ā', 'É', 'È', 'Ĕ', 'Ê', 'Ě', 'Ë', 'Ė', 'Ę', 'Ē', 'é', 'è', 'ĕ', 'ê', 'ě', 'ë', 'ė', 'ę', 'ē', 'Í', 'Ì', 'Ĭ', 'Î', 'Ï', 'İ', 'Į', 'Ī', 'í', 'ì', 'ĭ', 'î', 'ï', 'į', 'ī', 'Ó', 'Ò', 'Ŏ', 'Ô', 'Ö', 'Õ', 'Ő', 'Ø', 'Ō', 'ó', 'ò', 'ŏ', 'ô', 'ö', 'õ', 'ő', 'ø', 'ō', 'Ú', 'Ù', 'Ŭ', 'Û', 'Ů', 'Ü', 'Ű', 'Ų', 'Ū', 'ú', 'ù', 'ŭ', 'û', 'ů', 'ü', 'ű', 'ų', 'ū']},
                {'title': 'Polish', 'items': ['Ą', 'Ć', 'Ę', 'Ł', 'Ń', 'Ó', 'Ś', 'Ź', 'Ż', 'ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż']},
                {'title': 'Emojis', 'items': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😛', '😎', '🤩', '😏', '😞', '😢', '😭', '😤', '😠', '😡', '🤬', '😱', '😨', '🤗', '🤔', '🙄', '😴', '🤤', '😷', '🤒', '🤕', '👍', '👎', '👏', '🙌', '👐', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '👌', '🤏', '💪', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨']},
                {'title': 'Punctuation', 'items': ['…', '–', '—', ''', ''', '"', '"', '‚', '„', '‹', '›', '«', '»', '‡', '†', '•', '‰', '‱', '′', '″', '‴', '§', '¶', '©', '®', '™', '℠']},
            ]
        },
        'image': {
            'toolbar': []
        },
        'height': 350,
        'width': '100%',
    }
}
