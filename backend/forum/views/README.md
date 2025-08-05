# Forum Views Package

This package contains all forum-related views organized by functionality for better code maintainability and navigation.

## Structure

### 📁 `main_views.py`
Contains the main forum view:
- `forum_index()` - Main forum page showing root directories and announcements

### 📁 `directory_views.py`
Contains directory management views:
- `directory_view(directory_id)` - View posts and subdirectories in a specific directory
- `create_directory(parent_id=None)` - Create a new directory or subdirectory

### 📁 `post_views.py`
Contains post management views:
- `post_view(post_id)` - View comments in a specific post
- `create_post(directory_id)` - Create a new post in a directory
- `edit_post(post_id)` - Edit an existing post
- `delete_post(post_id)` - Delete a post

### 📁 `comment_views.py`
Contains comment management views:
- `create_comment(post_id)` - Create a new comment in a post
- `edit_comment(comment_id)` - Edit an existing comment
- `delete_comment(comment_id)` - Delete a comment

### 📁 `announcement_views.py`
Contains announcement management views (board members only):
- `manage_announcements()` - Manage announcements
- `create_announcement()` - Create a new announcement
- `edit_announcement(announcement_id)` - Edit an announcement
- `delete_announcement(announcement_id)` - Delete an announcement

## Import Structure

All views are imported into the package `__init__.py` file, so the existing URL patterns continue to work without any changes:

```python
# In urls.py, this still works:
from . import views
# views.forum_index, views.post_view, etc.
```

## Benefits

1. **Better Organization**: Each functionality is in its own file
2. **Easier Navigation**: Find specific views quickly
3. **Better Maintainability**: Smaller files are easier to maintain
4. **Clearer Responsibilities**: Each file has a clear purpose
5. **No Breaking Changes**: Existing imports continue to work

## Security

All views maintain their original security checks:
- Login requirements (`@login_required`)
- Access level checks (directory permissions)
- Owner permissions (edit/delete own content)
- Board member permissions (announcements)
