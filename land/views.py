"""
land/views.py - All views for the land app.
Syllabus: Views and URLs, HTTP requests and responses, function-based views,
          @login_required, permissions, sessions, cookies, ORM queries.
"""
import json
import logging
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse, HttpResponse, Http404
from django.core.exceptions import PermissionDenied
from django.db.models import Count, Sum, Q
from django.views.decorators.http import require_POST

from .models import State, LandParcel, AcquisitionCase, CaseUpdate
from .forms import ParcelForm, CaseForm, CaseStatusForm, ParcelSearchForm

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helper: check if user is an Officer (or superuser)
# Syllabus: Custom permission check, groups, PermissionDenied
# ---------------------------------------------------------------------------
def is_officer(user):
    """Returns True if user is an Officer or superuser."""
    return user.is_authenticated and (user.is_superuser or user.groups.filter(name='Officer').exists())


def officer_required(view_func):
    """
    Decorator for views that checks if the user is an Officer or admin.
    If anonymous, @login_required redirects to login.
    If authenticated but not an officer, raises PermissionDenied (returns 403).
    Syllabus: Custom decorators, permissions, raising PermissionDenied (triggers 403).
    """
    @login_required
    def _wrapped_view(request, *args, **kwargs):
        if not is_officer(request.user):
            raise PermissionDenied("You must be an Officer to perform this action.")
        return view_func(request, *args, **kwargs)
    return _wrapped_view


# ---------------------------------------------------------------------------
# Custom error handlers
# Syllabus: Error handling - custom 404, 403, 500 pages
# ---------------------------------------------------------------------------
def custom_404(request, exception):
    return render(request, '404.html', status=404)

def custom_403(request, exception):
    return render(request, '403.html', status=403)

def custom_500(request):
    return render(request, '500.html', status=500)


# ---------------------------------------------------------------------------
# Dashboard
# Syllabus: ORM queries - aggregate, annotate, values; sessions; JsonResponse
# ---------------------------------------------------------------------------
@login_required
def dashboard(request):
    """
    Main dashboard: stat cards + tables + live activity feed.
    Demonstrates: ORM aggregation, sessions (visit counter), @login_required.
    """
    # Syllabus: Sessions - track how many times user visits dashboard
    visits = request.session.get('visits', 0) + 1
    request.session['visits'] = visits

    # Syllabus: ORM queries - aggregate stats
    total_parcels = LandParcel.objects.count()
    total_area = LandParcel.objects.aggregate(total=Sum('area_acres'))['total'] or 0
    active_statuses = ['PROPOSED', 'UNDER_REVIEW', 'APPROVED', 'COMPENSATION_PAID']
    active_cases = AcquisitionCase.objects.filter(status__in=active_statuses).count()
    total_comp = AcquisitionCase.objects.filter(
        status__in=['COMPENSATION_PAID', 'COMPLETED']
    ).aggregate(total=Sum('compensation_amount'))['total'] or 0

    # Syllabus: ORM - values().annotate(Count()) for grouping
    cases_by_status = AcquisitionCase.objects.values('status').annotate(count=Count('id')).order_by('status')

    # Top 5 states by acquired area (cases that are approved or beyond)
    top_states = State.objects.filter(
        parcels__cases__status__in=['APPROVED', 'COMPENSATION_PAID', 'COMPLETED']
    ).annotate(
        acquired_area=Sum('parcels__area_acres')
    ).order_by('-acquired_area')[:5]

    # Latest 5 case updates (live activity feed)
    latest_updates = CaseUpdate.objects.select_related('case', 'updated_by').order_by('-timestamp')[:5]

    context = {
        'total_parcels': total_parcels,
        'total_area': total_area,
        'active_cases': active_cases,
        'total_comp': total_comp,
        'cases_by_status': cases_by_status,
        'top_states': top_states,
        'latest_updates': latest_updates,
        'visit_count': visits,
    }
    return render(request, 'land/dashboard.html', context)


# ---------------------------------------------------------------------------
# Stats API (real-time polling endpoint)
# Syllabus: JsonResponse, AJAX polling, different response types
# ---------------------------------------------------------------------------
@login_required
def stats_api(request):
    """
    Returns JSON stats for real-time dashboard polling.
    Demonstrates: JsonResponse (vs render/redirect), AJAX endpoint.
    """
    total_parcels = LandParcel.objects.count()
    total_area = float(LandParcel.objects.aggregate(total=Sum('area_acres'))['total'] or 0)
    active_statuses = ['PROPOSED', 'UNDER_REVIEW', 'APPROVED', 'COMPENSATION_PAID']
    active_cases = AcquisitionCase.objects.filter(status__in=active_statuses).count()
    total_comp = float(AcquisitionCase.objects.filter(
        status__in=['COMPENSATION_PAID', 'COMPLETED']
    ).aggregate(total=Sum('compensation_amount'))['total'] or 0)

    # Syllabus: JsonResponse - returns JSON instead of HTML
    return JsonResponse({
        'total_parcels': total_parcels,
        'total_area': total_area,
        'active_cases': active_cases,
        'total_comp': total_comp,
    })


# ---------------------------------------------------------------------------
# Parcel views
# Syllabus: GET/POST, URL params, sessions (recently viewed), cookies
# ---------------------------------------------------------------------------
@login_required
def parcel_list(request):
    """
    List all parcels with search/filter.
    Demonstrates: GET form, request.GET, ORM filtering with Q objects, cookies.
    """
    # Syllabus: Cookies - read saved state filter from cookie
    saved_state_code = request.COOKIES.get('last_state', '')

    form = ParcelSearchForm(request.GET)
    parcels = LandParcel.objects.select_related('state', 'created_by').all()

    # Apply filters from GET params
    q = request.GET.get('q', '').strip()
    state_id = request.GET.get('state', '')
    land_type = request.GET.get('land_type', '')

    if q:
        parcels = parcels.filter(
            Q(parcel_id__icontains=q) | Q(title__icontains=q) | Q(owner_name__icontains=q)
        )
    if state_id:
        parcels = parcels.filter(state_id=state_id)
    if land_type:
        parcels = parcels.filter(land_type=land_type)

    # Restore cookie filter if no state filter in URL
    if not state_id and saved_state_code:
        try:
            saved_state = State.objects.get(code=saved_state_code)
            # Pre-select the saved state in the form (for display)
            form = ParcelSearchForm(initial={'state': saved_state})
            parcels = parcels.filter(state__code=saved_state_code)
        except State.DoesNotExist:
            pass

    response = render(request, 'land/parcel_list.html', {
        'parcels': parcels,
        'form': form,
        'saved_state_code': saved_state_code,
    })

    # Syllabus: Cookies - save chosen state filter for 7 days
    if state_id:
        try:
            chosen_state = State.objects.get(pk=state_id)
            response.set_cookie('last_state', chosen_state.code, max_age=7*24*3600)
        except State.DoesNotExist:
            pass
    return response


@login_required
def parcel_detail(request, pk):
    """
    Detail view for a single parcel.
    Demonstrates: get_object_or_404, URL params (<int:pk>), sessions (recently viewed).
    Syllabus: URL parameters, get_object_or_404, sessions.
    """
    # Syllabus: get_object_or_404 - returns 404 if not found
    parcel = get_object_or_404(LandParcel, pk=pk)

    # Syllabus: Sessions - track recently viewed parcels (last 5, no duplicates)
    recent = request.session.get('recent_parcels', [])
    if pk in recent:
        recent.remove(pk)
    recent.insert(0, pk)
    request.session['recent_parcels'] = recent[:5]
    request.session.modified = True

    cases = parcel.cases.all().order_by('-created_at')
    return render(request, 'land/parcel_detail.html', {'parcel': parcel, 'cases': cases})


@officer_required
def parcel_create(request):
    """
    Create a new land parcel.
    Demonstrates: @user_passes_test, POST handling, ModelForm, POST→redirect→GET.
    Syllabus: Forms (POST), @login_required, permissions, redirect after POST.
    """
    if request.method == 'POST':
        form = ParcelForm(request.POST)
        if form.is_valid():
            parcel = form.save(commit=False)
            parcel.created_by = request.user  # Set the logged-in user as creator
            parcel.save()
            messages.success(request, f'Parcel {parcel.parcel_id} created successfully!')
            logger.info(f'Parcel {parcel.parcel_id} created by {request.user.username}')
            # Syllabus: POST → Redirect → GET
            return redirect('land:parcel_detail', pk=parcel.pk)
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = ParcelForm()

    return render(request, 'land/parcel_form.html', {'form': form, 'action': 'Create'})


@officer_required
def parcel_edit(request, pk):
    """
    Edit an existing parcel.
    Syllabus: Combining @login_required + @user_passes_test, ModelForm with instance.
    """
    parcel = get_object_or_404(LandParcel, pk=pk)

    if request.method == 'POST':
        form = ParcelForm(request.POST, instance=parcel)
        if form.is_valid():
            form.save()
            messages.success(request, f'Parcel {parcel.parcel_id} updated successfully!')
            return redirect('land:parcel_detail', pk=parcel.pk)
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = ParcelForm(instance=parcel)

    return render(request, 'land/parcel_form.html', {'form': form, 'parcel': parcel, 'action': 'Edit'})


@login_required
def parcel_delete(request, pk):
    """
    Delete a parcel - admin only. POST confirm.
    Syllabus: Permission checks (superuser only), PermissionDenied, POST confirm pattern.
    """
    parcel = get_object_or_404(LandParcel, pk=pk)

    # Only superusers (admin) can delete
    if not request.user.is_superuser:
        raise PermissionDenied  # Triggers custom 403 page

    if request.method == 'POST':
        parcel_id = parcel.parcel_id
        parcel.delete()
        messages.success(request, f'Parcel {parcel_id} has been deleted.')
        logger.info(f'Parcel {parcel_id} deleted by {request.user.username}')
        return redirect('land:parcel_list')

    return render(request, 'land/parcel_confirm_delete.html', {'parcel': parcel})


@login_required
def clear_cookie(request):
    """Clear the saved state filter cookie. Syllabus: Cookies - delete_cookie."""
    response = redirect('land:parcel_list')
    response.delete_cookie('last_state')
    messages.info(request, 'Saved filter cleared.')
    return response


@login_required
def parcels_by_state(request, code):
    """
    List parcels filtered by state code.
    Syllabus: re_path URL with named group, URL parameter (str:code).
    """
    state = get_object_or_404(State, code=code.upper())
    parcels = LandParcel.objects.filter(state=state).select_related('state')
    return render(request, 'land/parcel_list.html', {
        'parcels': parcels,
        'form': ParcelSearchForm(initial={'state': state}),
        'state_filter': state,
    })


@login_required
def cases_by_year(request, year):
    """
    List cases opened in a given year.
    Syllabus: re_path with year regex, ORM filter by date field.
    """
    cases = AcquisitionCase.objects.filter(
        created_at__year=int(year)
    ).select_related('parcel', 'opened_by').order_by('-created_at')
    return render(request, 'land/case_list.html', {
        'cases': cases,
        'year_filter': year,
    })


# ---------------------------------------------------------------------------
# Case views (stubs - will be fully implemented in Phase 4)
# ---------------------------------------------------------------------------
@login_required
def case_list(request):
    """List all acquisition cases with status filter."""
    status_filter = request.GET.get('status', '')
    cases = AcquisitionCase.objects.select_related('parcel', 'opened_by').all().order_by('-created_at')
    if status_filter:
        cases = cases.filter(status=status_filter)
    return render(request, 'land/case_list.html', {
        'cases': cases,
        'status_filter': status_filter,
        'status_choices': AcquisitionCase.STATUS_CHOICES,
    })


@officer_required
def case_create(request):
    """Create a new acquisition case."""
    if request.method == 'POST':
        form = CaseForm(request.POST)
        if form.is_valid():
            case = form.save(commit=False)
            case.opened_by = request.user
            case.save()
            # Create initial CaseUpdate
            CaseUpdate.objects.create(
                case=case, old_status='', new_status='PROPOSED',
                remarks='Case opened.', updated_by=request.user
            )
            messages.success(request, f'Case for {case.parcel.parcel_id} created successfully!')
            return redirect('land:case_detail', pk=case.pk)
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        initial = {}
        parcel_id = request.GET.get('parcel')
        if parcel_id:
            try:
                initial['parcel'] = LandParcel.objects.get(pk=parcel_id)
            except LandParcel.DoesNotExist:
                pass
        form = CaseForm(initial=initial)
    return render(request, 'land/case_form.html', {'form': form})


@login_required
def case_detail(request, pk):
    """Detail view for a case with its update timeline."""
    case = get_object_or_404(AcquisitionCase, pk=pk)
    updates = case.updates.all().order_by('timestamp')
    return render(request, 'land/case_detail.html', {'case': case, 'updates': updates})


@officer_required
def case_update_status(request, pk):
    """Update a case's status and log the change."""
    case = get_object_or_404(AcquisitionCase, pk=pk)
    if request.method == 'POST':
        form = CaseStatusForm(case.status, request.POST)
        if form.is_valid():
            old_status = case.status
            new_status = form.cleaned_data['new_status']
            comp = form.cleaned_data.get('compensation_amount')
            remarks = form.cleaned_data['remarks']
            case.status = new_status
            if comp:
                case.compensation_amount = comp
            case.save()
            CaseUpdate.objects.create(
                case=case, old_status=old_status, new_status=new_status,
                remarks=remarks, updated_by=request.user
            )
            logger.info(f'Case #{case.pk} status changed: {old_status} → {new_status} by {request.user.username}')
            messages.success(request, f'Status updated to {new_status}.')
            return redirect('land:case_detail', pk=case.pk)
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = CaseStatusForm(case.status)
    return render(request, 'land/case_status_form.html', {'form': form, 'case': case})


# ---------------------------------------------------------------------------
# React Single Page Application View
# ---------------------------------------------------------------------------
def react_app(request):
    """Serve the built modern React frontend."""
    from django.conf import settings
    dist_index = settings.BASE_DIR / 'frontend' / 'dist' / 'index.html'
    if dist_index.exists():
        with open(dist_index, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type="text/html; charset=utf-8")
    return HttpResponse(
        "React frontend not built yet. Run 'npm run build' inside frontend/ directory.",
        status=500
    )

# Syllabus: Simple view returning HttpResponse + render
# ---------------------------------------------------------------------------
def about(request):
    """
    Simple about page. Demonstrates: request/response cycle, plain view (no login required).
    Syllabus: HttpResponse, rendering a template.
    """
    return render(request, 'land/about.html', {
        'request_method': request.method,
        'request_path': request.path,
    })
