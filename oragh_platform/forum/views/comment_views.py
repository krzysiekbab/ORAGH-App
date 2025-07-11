from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponseForbidden
from ..models import Post, Comment
from ..forms import CommentForm


@login_required
def create_comment(request, post_id):
    """Create a new comment in a post"""
    post = get_object_or_404(Post, id=post_id)
    
    # Check if user can access this post
    if not post.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tego postu.")
    
    # Check if post is locked
    if post.is_locked:
        messages.error(request, 'Ten post jest zablokowany.')
        return redirect('forum:post', post_id=post.id)
    
    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.post = post
            comment.author = request.user
            comment.save()
            
            messages.success(request, 'Komentarz został dodany.')
            
            # Redirect to last page of post
            comments_count = post.get_comments_count()
            last_page = (comments_count - 1) // 10 + 1  # 10 comments per page
            return redirect(f"{post.get_absolute_url()}?page={last_page}#{comment.id}")
    
    return redirect('forum:post', post_id=post.id)


@login_required
def edit_comment(request, comment_id):
    """Edit an existing comment"""
    comment = get_object_or_404(Comment, id=comment_id)
    
    # Check if user can access this post
    if not comment.post.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tego postu.")
    
    # Check if user can edit this comment (only comment owner can edit)
    if request.user != comment.author:
        return HttpResponseForbidden("Nie możesz edytować tego komentarza.")
    
    if request.method == 'POST':
        form = CommentForm(request.POST, instance=comment)
        if form.is_valid():
            form.save()
            messages.success(request, 'Komentarz został zaktualizowany.')
            return redirect('forum:post', post_id=comment.post.id)
    else:
        form = CommentForm(instance=comment)
    
    context = {
        'comment': comment,
        'post': comment.post,
        'form': form,
    }
    return render(request, 'comments/edit_comment.jinja', context)


@login_required
def delete_comment(request, comment_id):
    """Delete a comment"""
    comment = get_object_or_404(Comment, id=comment_id)
    
    # Check if user can access this post
    if not comment.post.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tego postu.")
    
    # Check if user can delete this comment
    if not comment.can_user_delete(request.user):
        return HttpResponseForbidden("Nie możesz usunąć tego komentarza.")
    
    # Check if this is the only comment in post
    if comment.post.get_comments_count() == 1:
        # Delete the entire post
        directory = comment.post.directory
        comment.post.delete()
        messages.success(request, 'Post został usunięty.')
        return redirect('forum:directory', directory_id=directory.id)
    
    if request.method == 'POST':
        comment.delete()
        messages.success(request, 'Komentarz został usunięty.')
        return redirect('forum:post', post_id=comment.post.id)
    
    context = {
        'comment': comment,
        'post': comment.post,
    }
    return render(request, 'comments/delete_comment.jinja', context)
