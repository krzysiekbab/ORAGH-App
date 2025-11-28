"""
Custom permissions for the seasons app.
"""

from rest_framework import permissions


class IsBoardMemberOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow board members to create/update/delete objects.
    Read permissions are granted to all authenticated users.
    """

    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed to board members
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_superuser or request.user.groups.filter(name='board').exists())
        )


class IsBoardMember(permissions.BasePermission):
    """
    Custom permission that only allows board members to access the view.
    """

    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_superuser or request.user.groups.filter(name='board').exists())
        )
