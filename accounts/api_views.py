"""
REST/JSON API views for accounts (Authentication & Session info).
Used by the modern React frontend.
"""
import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User, Group


def get_user_role(user):
    """Determine high-level role for the frontend UI."""
    if not user.is_authenticated:
        return 'Anonymous'
    if user.is_superuser:
        return 'Admin'
    if user.groups.filter(name='Officer').exists():
        return 'Officer'
    return 'Viewer'


@require_http_methods(["GET"])
def api_me(request):
    """Return currently logged-in user profile, role, and permissions."""
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False, "user": None})

    user = request.user
    role = get_user_role(user)
    return JsonResponse({
        "authenticated": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": role,
            "is_superuser": user.is_superuser,
            "is_officer": role in ['Admin', 'Officer'],
            "date_joined": user.date_joined.strftime("%d %b %Y"),
        }
    })


@csrf_exempt
@require_http_methods(["POST"])
def api_login(request):
    """Handle user login via JSON POST."""
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return JsonResponse({"error": "Username and password are required."}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        role = get_user_role(user)
        return JsonResponse({
            "success": True,
            "message": f"Welcome back, {user.username}!",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": role,
                "is_superuser": user.is_superuser,
                "is_officer": role in ['Admin', 'Officer'],
            }
        })
    else:
        return JsonResponse({"error": "Invalid username or password."}, status=401)


@csrf_exempt
@require_http_methods(["POST"])
def api_signup(request):
    """Register a new user and automatically assign to Viewer group."""
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return JsonResponse({"error": "Username and password are required."}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "A user with this username already exists."}, status=400)

    if email and User.objects.filter(email=email).exists():
        return JsonResponse({"error": "A user with this email already exists."}, status=400)

    # Create user
    user = User.objects.create_user(username=username, email=email, password=password)
    viewer_group, _ = Group.objects.get_or_create(name='Viewer')
    user.groups.add(viewer_group)
    user.save()

    # Log user in
    login(request, user)
    return JsonResponse({
        "success": True,
        "message": f"Account created for {user.username}!",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": "Viewer",
            "is_superuser": False,
            "is_officer": False,
        }
    })


@csrf_exempt
@require_http_methods(["POST"])
def api_logout(request):
    """Log out current user."""
    logout(request)
    return JsonResponse({"success": True, "message": "Logged out successfully."})


# ---------------------------------------------------------------------------
# Admin User Management APIs
# ---------------------------------------------------------------------------
@require_http_methods(["GET"])
def api_admin_users(request):
    """List all registered users (Admin only)."""
    if not (request.user.is_authenticated and request.user.is_superuser):
        return JsonResponse({"error": "Admin privileges required."}, status=403)

    users = User.objects.all().order_by('-date_joined')
    user_list = [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": get_user_role(u),
            "is_superuser": u.is_superuser,
            "date_joined": u.date_joined.strftime("%d %b %Y, %H:%M"),
        }
        for u in users
    ]
    return JsonResponse({"users": user_list, "count": len(user_list)})


@csrf_exempt
@require_http_methods(["POST"])
def api_admin_set_role(request, user_id):
    """Change a user's role to Officer or Viewer (Admin only)."""
    if not (request.user.is_authenticated and request.user.is_superuser):
        return JsonResponse({"error": "Admin privileges required."}, status=403)

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)

    if user.is_superuser:
        return JsonResponse({"error": "Superuser role cannot be modified via role manager."}, status=400)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"error": "Invalid JSON."}, status=400)

    target_role = data.get("role", "").strip()
    officer_group, _ = Group.objects.get_or_create(name='Officer')
    viewer_group, _ = Group.objects.get_or_create(name='Viewer')

    if target_role == "Officer":
        user.groups.remove(viewer_group)
        user.groups.add(officer_group)
    elif target_role == "Viewer":
        user.groups.remove(officer_group)
        user.groups.add(viewer_group)
    else:
        return JsonResponse({"error": "Role must be 'Officer' or 'Viewer'."}, status=400)

    user.save()
    return JsonResponse({
        "success": True,
        "message": f"User {user.username} role updated to {target_role}.",
        "new_role": target_role
    })


