from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.http import HttpResponseForbidden
from ..models import Directory, Post, Comment
from ..forms import CommentForm, PostForm


@login_required
def post_view(request, post_id):
    """View comments in a specific post"""
    post = get_object_or_404(Post, id=post_id)
    
    # Check if user can access this post's directory
    if not post.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tego postu.")
    
    # Get comments with pagination
    comments = Comment.objects.filter(post=post).select_related('author', 'author__musicianprofile')
    paginator = Paginator(comments, 10)  # 10 comments per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Add permission info to each comment
    for comment in page_obj:
        comment.user_can_delete = comment.can_user_delete(request.user)
    
    context = {
        'post': post,
        'comments': page_obj,
        'can_reply': not post.is_locked,  # Users can reply if post is not locked
        'can_edit_post': request.user.is_staff or request.user == post.author,
        'can_delete_post': post.can_user_delete(request.user),
        'comment_form': CommentForm(),
    }
    return render(request, 'posts/post_view.jinja', context)


@login_required
def create_post(request, directory_id):
    """Create a new post in a directory"""
    directory = get_object_or_404(Directory, id=directory_id)
    
    # Check if user can access this directory
    if not directory.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tego katalogu.")
    
    if request.method == 'POST':
        form = PostForm(request.POST)
        if form.is_valid():
            title = form.cleaned_data['title']
            content = form.cleaned_data['content']
            
            # Create post
            post = Post.objects.create(
                title=title,
                directory=directory,
                author=request.user
            )
            
            # Create first comment
            Comment.objects.create(
                post=post,
                author=request.user,
                content=content
            )
            
            messages.success(request, f'Post "{title}" został utworzony.')
            return redirect('forum:post', post_id=post.id)
    else:
        form = PostForm()
    
    context = {
        'directory': directory,
        'form': form,
    }
    return render(request, 'posts/create_post.jinja', context)


@login_required
def edit_post(request, post_id):
    """Edit an existing post"""
    post = get_object_or_404(Post, id=post_id)
    
    # Check if user can access this post
    if not post.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tego postu.")
    
    # Check if user can edit this post (only post owner can edit)
    if request.user != post.author:
        return HttpResponseForbidden("Nie możesz edytować tego postu.")
    
    # Get the first comment (which contains the post content)
    first_comment = post.comments.order_by('created_at').first()
    if not first_comment:
        # If no comments exist, create a default one
        first_comment = Comment.objects.create(
            post=post,
            author=post.author,
            content="Brak treści"
        )
    
    if request.method == 'POST':
        # Get form data
        title = request.POST.get('title', '').strip()
        content = request.POST.get('content', '').strip()
        
        if title and content:
            # Update post title
            post.title = title
            post.save()
            
            # Update first comment content
            first_comment.content = content
            first_comment.save()
            
            messages.success(request, 'Post został zaktualizowany.')
            return redirect('forum:post', post_id=post.id)
        else:
            messages.error(request, 'Tytuł i treść są wymagane.')
    
    context = {
        'post': post,
        'post_title': post.title,
        'post_content': first_comment.content if first_comment else '',
    }
    return render(request, 'posts/edit_post.jinja', context)


@login_required
def delete_post(request, post_id):
    """Delete a post"""
    post = get_object_or_404(Post, id=post_id)
    
    # Check if user can access this post
    if not post.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tego postu.")
    
    # Check if user can delete this post
    if not post.can_user_delete(request.user):
        return HttpResponseForbidden("Nie możesz usunąć tego postu.")
    
    directory = post.directory
    
    if request.method == 'POST':
        post.delete()
        messages.success(request, 'Post został usunięty.')
        return redirect('forum:directory', directory_id=directory.id)
    
    context = {
        'post': post,
    }
    return render(request, 'posts/delete_post.jinja', context)
