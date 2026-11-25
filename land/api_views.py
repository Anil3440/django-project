"""
REST/JSON API views for the land app.
Supplies data to the modern React frontend.
"""
import json
import logging
from decimal import Decimal
from django.http import JsonResponse, Http404
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Sum, Q
from django.shortcuts import get_object_or_404
from .models import State, LandParcel, AcquisitionCase, CaseUpdate

logger = logging.getLogger(__name__)


def is_officer(user):
    return user.is_authenticated and (user.is_superuser or user.groups.filter(name='Officer').exists())


@require_http_methods(["GET"])
def api_dashboard(request):
    """Aggregated stats and dashboard feed for decision support."""
    # Track visits in session if logged in
    if request.user.is_authenticated:
        request.session['visits'] = request.session.get('visits', 0) + 1

    total_parcels = LandParcel.objects.count()
    total_area = float(LandParcel.objects.aggregate(total=Sum('area_acres'))['total'] or 0)
    active_statuses = ['PROPOSED', 'UNDER_REVIEW', 'APPROVED', 'COMPENSATION_PAID']
    active_cases = AcquisitionCase.objects.filter(status__in=active_statuses).count()
    total_comp = float(AcquisitionCase.objects.filter(
        status__in=['COMPENSATION_PAID', 'COMPLETED']
    ).aggregate(total=Sum('compensation_amount'))['total'] or 0)

    # Cases by status grouping
    status_counts = {s[0]: 0 for s in AcquisitionCase.STATUS_CHOICES}
    for row in AcquisitionCase.objects.values('status').annotate(count=Count('id')):
        status_counts[row['status']] = row['count']

    cases_by_status = [
        {"status": s, "label": dict(AcquisitionCase.STATUS_CHOICES).get(s, s), "count": count}
        for s, count in status_counts.items()
    ]

    # Land by type breakdown
    parcels_by_type = list(
        LandParcel.objects.values('land_type').annotate(
            count=Count('id'), total_acres=Sum('area_acres')
        ).order_by('-count')
    )

    # Top states by acquired area
    top_states_qs = State.objects.filter(
        parcels__cases__status__in=['APPROVED', 'COMPENSATION_PAID', 'COMPLETED']
    ).annotate(
        acquired_area=Sum('parcels__area_acres')
    ).order_by('-acquired_area')[:5]

    top_states = [
        {"name": s.name, "code": s.code, "acquired_area": float(s.acquired_area or 0)}
        for s in top_states_qs
    ]

    # Latest activity updates
    updates_qs = CaseUpdate.objects.select_related('case', 'updated_by').order_by('-timestamp')[:8]
    latest_updates = [
        {
            "id": u.id,
            "case_id": u.case.id,
            "project_name": u.case.project_name,
            "old_status": u.old_status,
            "new_status": u.new_status,
            "remarks": u.remarks,
            "timestamp": u.timestamp.strftime("%d %b, %H:%M"),
            "updated_by": u.updated_by.username,
        }
        for u in updates_qs
    ]

    return JsonResponse({
        "total_parcels": total_parcels,
        "total_area": round(total_area, 2),
        "active_cases": active_cases,
        "total_comp": round(total_comp, 2),
        "cases_by_status": cases_by_status,
        "parcels_by_type": parcels_by_type,
        "top_states": top_states,
        "latest_updates": latest_updates,
        "visits": request.session.get('visits', 1) if request.user.is_authenticated else 0,
    })


@require_http_methods(["GET"])
def api_states(request):
    """List all Indian states registered in the system."""
    states = State.objects.all().order_by('name')
    return JsonResponse({
        "states": [{"id": s.id, "name": s.name, "code": s.code} for s in states]
    })


@csrf_exempt
@require_http_methods(["GET", "POST"])
def api_parcels(request):
    """List parcels (GET) or create a new parcel (POST)."""
    if request.method == "GET":
        q = request.GET.get('q', '').strip()
        state_code = request.GET.get('state', '').strip()
        land_type = request.GET.get('land_type', '').strip()

        qs = LandParcel.objects.select_related('state', 'created_by').all().order_by('-created_at')

        if q:
            qs = qs.filter(
                Q(parcel_id__icontains=q) | Q(title__icontains=q) | Q(owner_name__icontains=q) | Q(district__icontains=q)
            )
        if state_code:
            qs = qs.filter(state__code__iexact=state_code)
        if land_type:
            qs = qs.filter(land_type__iexact=land_type)

        parcels = [
            {
                "id": p.id,
                "parcel_id": p.parcel_id,
                "title": p.title,
                "state_code": p.state.code,
                "state_name": p.state.name,
                "district": p.district,
                "area_acres": float(p.area_acres),
                "land_type": p.land_type,
                "owner_name": p.owner_name,
                "market_value": float(p.market_value),
                "created_by": p.created_by.username,
                "created_at": p.created_at.strftime("%d %b %Y"),
                "active_case": p.cases.filter(
                    status__in=['PROPOSED', 'UNDER_REVIEW', 'APPROVED', 'COMPENSATION_PAID']
                ).exists()
            }
            for p in qs
        ]
        return JsonResponse({"parcels": parcels, "count": len(parcels)})

    # POST - Create new parcel
    if not is_officer(request.user):
        return JsonResponse({"error": "Unauthorized: Officer or Admin permissions required."}, status=403)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    parcel_id = data.get('parcel_id', '').strip().upper()
    title = data.get('title', '').strip()
    state_id = data.get('state_id')
    district = data.get('district', '').strip()
    area_acres = data.get('area_acres')
    land_type = data.get('land_type')
    owner_name = data.get('owner_name', '').strip()
    market_value = data.get('market_value')

    if not all([parcel_id, title, state_id, district, area_acres, land_type, owner_name, market_value]):
        return JsonResponse({"error": "All fields are required."}, status=400)

    try:
        area_acres = float(area_acres)
        if area_acres <= 0:
            return JsonResponse({"error": "Area must be greater than 0."}, status=400)
    except ValueError:
        return JsonResponse({"error": "Invalid area value."}, status=400)

    try:
        market_value = float(market_value)
        if market_value <= 0:
            return JsonResponse({"error": "Market value must be greater than 0."}, status=400)
    except ValueError:
        return JsonResponse({"error": "Invalid market value."}, status=400)

    if LandParcel.objects.filter(parcel_id=parcel_id).exists():
        return JsonResponse({"error": f"Parcel ID {parcel_id} already exists."}, status=400)

    try:
        state = State.objects.get(pk=state_id)
    except State.DoesNotExist:
        return JsonResponse({"error": "Selected State not found."}, status=400)

    parcel = LandParcel.objects.create(
        parcel_id=parcel_id,
        title=title,
        state=state,
        district=district,
        area_acres=Decimal(str(area_acres)),
        land_type=land_type,
        owner_name=owner_name,
        market_value=Decimal(str(market_value)),
        created_by=request.user,
    )

    return JsonResponse({
        "success": True,
        "message": f"Parcel {parcel.parcel_id} registered successfully!",
        "parcel_id": parcel.id,
    })


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def api_parcel_detail(request, pk):
    """Retrieve, update or delete a specific parcel."""
    parcel = get_object_or_404(LandParcel.objects.select_related('state', 'created_by'), pk=pk)

    if request.method == "GET":
        # Track in session recent parcels
        if request.user.is_authenticated:
            recent = request.session.get('recent_parcels', [])
            if pk in recent:
                recent.remove(pk)
            recent.insert(0, pk)
            request.session['recent_parcels'] = recent[:5]
            request.session.modified = True

        cases = [
            {
                "id": c.id,
                "project_name": c.project_name,
                "purpose": c.purpose,
                "status": c.status,
                "compensation_amount": float(c.compensation_amount) if c.compensation_amount else None,
                "created_at": c.created_at.strftime("%d %b %Y"),
            }
            for c in parcel.cases.all().order_by('-created_at')
        ]

        return JsonResponse({
            "parcel": {
                "id": parcel.id,
                "parcel_id": parcel.parcel_id,
                "title": parcel.title,
                "state_id": parcel.state.id,
                "state_code": parcel.state.code,
                "state_name": parcel.state.name,
                "district": parcel.district,
                "area_acres": float(parcel.area_acres),
                "land_type": parcel.land_type,
                "owner_name": parcel.owner_name,
                "market_value": float(parcel.market_value),
                "created_by": parcel.created_by.username,
                "created_at": parcel.created_at.strftime("%d %b %Y, %H:%M"),
            },
            "cases": cases
        })

    if request.method in ["PUT", "PATCH"]:
        if not is_officer(request.user):
            return JsonResponse({"error": "Unauthorized: Officer or Admin permissions required."}, status=403)

        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({"error": "Invalid JSON."}, status=400)

        if 'title' in data:
            parcel.title = data['title']
        if 'district' in data:
            parcel.district = data['district']
        if 'owner_name' in data:
            parcel.owner_name = data['owner_name']
        if 'land_type' in data:
            parcel.land_type = data['land_type']
        if 'area_acres' in data:
            parcel.area_acres = Decimal(str(data['area_acres']))
        if 'market_value' in data:
            parcel.market_value = Decimal(str(data['market_value']))
        if 'state_id' in data:
            try:
                parcel.state = State.objects.get(pk=data['state_id'])
            except State.DoesNotExist:
                return JsonResponse({"error": "Invalid State ID."}, status=400)

        parcel.save()
        return JsonResponse({"success": True, "message": f"Parcel {parcel.parcel_id} updated."})

    if request.method == "DELETE":
        if not request.user.is_superuser:
            return JsonResponse({"error": "Only Admins are permitted to delete parcels."}, status=403)

        pid = parcel.parcel_id
        parcel.delete()
        return JsonResponse({"success": True, "message": f"Parcel {pid} deleted successfully."})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def api_cases(request):
    """List acquisition cases (GET) or open a new acquisition case (POST)."""
    if request.method == "GET":
        status_filter = request.GET.get('status', '').strip()
        year_filter = request.GET.get('year', '').strip()

        qs = AcquisitionCase.objects.select_related('parcel', 'opened_by', 'parcel__state').all().order_by('-created_at')

        if status_filter:
            qs = qs.filter(status=status_filter)
        if year_filter and year_filter.isdigit():
            qs = qs.filter(created_at__year=int(year_filter))

        cases = [
            {
                "id": c.id,
                "project_name": c.project_name,
                "purpose": c.purpose,
                "status": c.status,
                "compensation_amount": float(c.compensation_amount) if c.compensation_amount else None,
                "parcel_id": c.parcel.parcel_id,
                "parcel_pk": c.parcel.id,
                "parcel_title": c.parcel.title,
                "state_code": c.parcel.state.code,
                "area_acres": float(c.parcel.area_acres),
                "opened_by": c.opened_by.username,
                "created_at": c.created_at.strftime("%d %b %Y"),
            }
            for c in qs
        ]
        return JsonResponse({"cases": cases, "count": len(cases)})

    # POST - Create new case
    if not is_officer(request.user):
        return JsonResponse({"error": "Unauthorized: Officer or Admin permissions required."}, status=403)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"error": "Invalid JSON."}, status=400)

    parcel_pk = data.get('parcel_id')
    project_name = data.get('project_name', '').strip()
    purpose = data.get('purpose', '').strip()

    if not all([parcel_pk, project_name, purpose]):
        return JsonResponse({"error": "Parcel, project name, and purpose are required."}, status=400)

    try:
        parcel = LandParcel.objects.get(pk=parcel_pk)
    except LandParcel.DoesNotExist:
        return JsonResponse({"error": "Selected Land Parcel does not exist."}, status=400)

    active_statuses = ['PROPOSED', 'UNDER_REVIEW', 'APPROVED', 'COMPENSATION_PAID']
    if parcel.cases.filter(status__in=active_statuses).exists():
        return JsonResponse({
            "error": f"Parcel {parcel.parcel_id} already has an active acquisition case."
        }, status=400)

    case = AcquisitionCase.objects.create(
        parcel=parcel,
        project_name=project_name,
        purpose=purpose,
        status='PROPOSED',
        opened_by=request.user
    )

    # Automatically log initial update
    CaseUpdate.objects.create(
        case=case,
        old_status='',
        new_status='PROPOSED',
        remarks='Acquisition case initiated.',
        updated_by=request.user
    )

    return JsonResponse({
        "success": True,
        "message": f"Case #{case.id} for {parcel.parcel_id} opened successfully!",
        "case_id": case.id
    })


@csrf_exempt
@require_http_methods(["GET"])
def api_case_detail(request, pk):
    """Retrieve case details and its complete timeline of updates."""
    case = get_object_or_404(
        AcquisitionCase.objects.select_related('parcel', 'opened_by', 'parcel__state'),
        pk=pk
    )

    valid_next = AcquisitionCase.VALID_TRANSITIONS.get(case.status, [])

    updates = [
        {
            "id": u.id,
            "old_status": u.old_status,
            "new_status": u.new_status,
            "remarks": u.remarks,
            "timestamp": u.timestamp.strftime("%d %b %Y, %H:%M"),
            "updated_by": u.updated_by.username,
        }
        for u in case.updates.all().order_by('-timestamp')
    ]

    return JsonResponse({
        "case": {
            "id": case.id,
            "project_name": case.project_name,
            "purpose": case.purpose,
            "status": case.status,
            "compensation_amount": float(case.compensation_amount) if case.compensation_amount else None,
            "opened_by": case.opened_by.username,
            "created_at": case.created_at.strftime("%d %b %Y, %H:%M"),
            "valid_next_statuses": valid_next,
            "parcel": {
                "id": case.parcel.id,
                "parcel_id": case.parcel.parcel_id,
                "title": case.parcel.title,
                "state_code": case.parcel.state.code,
                "state_name": case.parcel.state.name,
                "district": case.parcel.district,
                "area_acres": float(case.parcel.area_acres),
                "land_type": case.parcel.land_type,
                "owner_name": case.parcel.owner_name,
                "market_value": float(case.parcel.market_value),
            }
        },
        "updates": updates
    })


@csrf_exempt
@require_http_methods(["POST"])
def api_case_update_status(request, pk):
    """Advance case status through the legal workflow with validation and audit log."""
    if not is_officer(request.user):
        return JsonResponse({"error": "Unauthorized: Officer or Admin permissions required."}, status=403)

    case = get_object_or_404(AcquisitionCase, pk=pk)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    new_status = data.get('new_status', '').strip()
    compensation = data.get('compensation_amount')
    remarks = data.get('remarks', '').strip()

    if not new_status:
        return JsonResponse({"error": "Next status is required."}, status=400)
    if not remarks:
        return JsonResponse({"error": "Remarks are required for audit logging."}, status=400)

    valid_next = AcquisitionCase.VALID_TRANSITIONS.get(case.status, [])
    if new_status not in valid_next:
        return JsonResponse({
            "error": f"Invalid transition: {case.status} → {new_status}. Allowed: {', '.join(valid_next) or 'none'}"
        }, status=400)

    if new_status == 'APPROVED' and not compensation:
        return JsonResponse({"error": "Compensation amount is required when approving a case."}, status=400)

    old_status = case.status
    case.status = new_status
    if compensation:
        case.compensation_amount = Decimal(str(compensation))
    case.save()

    # Log update
    CaseUpdate.objects.create(
        case=case,
        old_status=old_status,
        new_status=new_status,
        remarks=remarks,
        updated_by=request.user
    )

    return JsonResponse({
        "success": True,
        "message": f"Case #{case.id} status transitioned to {new_status}.",
        "new_status": new_status,
    })

