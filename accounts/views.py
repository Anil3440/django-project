"""
Accounts views: signup, login, logout, profile.
Syllabus: Views and URLs, HTTP requests and responses, authentication, sessions.
"""
import logging
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from django.contrib import messages
from .forms import SignupForm, LoginForm

logger = logging.getLogger(__name__)


def signup_view(request):
    """
    Handles user registration.
    Syllabus: POST form handling, redirect after POST, flash messages, group assignment.
    """
    if request.user.is_authenticated:
        return redirect('land:dashboard')

    if request.method == 'POST':
        # Syllabus: request.method and request.POST
        form = SignupForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Automatically place new users in the Viewer group
            viewer_group, _ = Group.objects.get_or_create(name='Viewer')
            user.groups.add(viewer_group)
            # Log the user in immediately after signup
            login(request, user)
            messages.success(request, f'Welcome, {user.username}! Your account has been created.')
            logger.info(f'New user signed up: {user.username}')
            # Syllabus: POST -> Redirect -> GET pattern
            return redirect('land:dashboard')
    else:
        form = SignupForm()

    # Syllabus: render() returns an HttpResponse with the rendered template
    return render(request, 'accounts/signup.html', {'form': form})


def login_view(request):
    """
    Handles user login using Django's authenticate() and login().
    Syllabus: authenticate(), login(), ?next= redirect, request.GET.
    """
    if request.user.is_authenticated:
        return redirect('land:dashboard')

    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, f'Welcome back, {user.username}!')
            logger.info(f'User logged in: {user.username}')
            # Syllabus: Support ?next= redirect parameter
            next_url = request.GET.get('next', 'land:dashboard')
            return redirect(next_url)
        else:
            messages.error(request, 'Invalid username or password.')
    else:
        form = LoginForm(request)

    return render(request, 'accounts/login.html', {'form': form})


def logout_view(request):
    """
    Handles logout - POST only for CSRF protection.
    Syllabus: logout(), POST-only view, CSRF protection.
    """
    if request.method == 'POST':
        username = request.user.username
        logout(request)
        messages.info(request, f'You have been logged out, {username}.')
        logger.info(f'User logged out: {username}')
        # Syllabus: redirect() after POST
        return redirect('accounts:login')
    return redirect('accounts:login')


@login_required
def profile_view(request):
    """
    Shows user profile, session visit count, and recently viewed parcels.
    Syllabus: @login_required, sessions (request.session), template variables.
    """
    # Syllabus: Sessions - read visit count and recently viewed parcels
    visit_count = request.session.get('visits', 0)

    # Get recently viewed parcel objects from session IDs
    recent_parcel_ids = request.session.get('recent_parcels', [])
    recent_parcels = []
    if recent_parcel_ids:
        from land.models import LandParcel
        # Preserve order by fetching in order
        parcel_map = {p.pk: p for p in LandParcel.objects.filter(pk__in=recent_parcel_ids)}
        recent_parcels = [parcel_map[pid] for pid in recent_parcel_ids if pid in parcel_map]

    context = {
        'visit_count': visit_count,
        'recent_parcels': recent_parcels,
    }
    return render(request, 'accounts/profile.html', context)
