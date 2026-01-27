"""
Email utilities for user account management.
"""
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_activation_request_to_admin(user, activation_token):
    """
    Send email to admin requesting activation of a new user account.
    """
    activation_url = f"{settings.FRONTEND_URL}/activate/{activation_token.token}"
    
    context = {
        'user': user,
        'activation_url': activation_url,
        'site_name': settings.SITE_NAME,
    }
    
    subject = f"[{settings.SITE_NAME}] Nowa rejestracja - {user.first_name} {user.last_name}"
    
    # Render HTML template
    html_content = render_to_string('emails/activation_request_admin.html', context)
    text_content = strip_tags(html_content)
    
    # Create email with both HTML and plain text versions
    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[settings.ADMIN_EMAIL],
    )
    email.attach_alternative(html_content, "text/html")
    
    try:
        email.send(fail_silently=False)
        return True
    except Exception as e:
        print(f"Error sending activation request email: {e}")
        return False


def send_account_activated_email(user):
    """
    Send email to user notifying them that their account has been activated.
    """
    login_url = f"{settings.FRONTEND_URL}/login"
    
    context = {
        'user': user,
        'login_url': login_url,
        'site_name': settings.SITE_NAME,
    }
    
    subject = f"[{settings.SITE_NAME}] Twoje konto zostało aktywowane!"
    
    # Render HTML template
    html_content = render_to_string('emails/account_activated.html', context)
    text_content = strip_tags(html_content)
    
    # Create email with both HTML and plain text versions
    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    email.attach_alternative(html_content, "text/html")
    
    try:
        email.send(fail_silently=False)
        return True
    except Exception as e:
        print(f"Error sending account activated email: {e}")
        return False


def send_account_rejected_email(user, reason=None):
    """
    Send email to user notifying them that their account registration was rejected.
    """
    context = {
        'user': user,
        'reason': reason,
        'site_name': settings.SITE_NAME,
    }
    
    subject = f"[{settings.SITE_NAME}] Informacja o rejestracji"
    
    # Render HTML template
    html_content = render_to_string('emails/account_rejected.html', context)
    text_content = strip_tags(html_content)
    
    # Create email with both HTML and plain text versions
    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    email.attach_alternative(html_content, "text/html")
    
    try:
        email.send(fail_silently=False)
        return True
    except Exception as e:
        print(f"Error sending account rejected email: {e}")
        return False
