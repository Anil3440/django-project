"""
Tests for land app.
Testing React SPA routing, Models, API endpoints, Permissions, and Form validations.
"""
from django.test import TestCase, Client
from django.contrib.auth.models import User, Group
from django.urls import reverse, resolve
from land.models import State, LandParcel, AcquisitionCase, CaseUpdate
from land.forms import ParcelForm, CaseStatusForm
import json


class LandModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='officer', password='pass')
        self.state = State.objects.create(name='Punjab', code='PB')
        self.parcel = LandParcel.objects.create(
            parcel_id='PB-LDH-0001',
            title='Ludhiana Farm',
            state=self.state,
            district='Ludhiana',
            area_acres=25.5,
            land_type='Agricultural',
            owner_name='Harbhajan Singh',
            market_value=3000000,
            created_by=self.user,
        )

    def test_land_parcel_str(self):
        """Test LandParcel.__str__ returns formatted string."""
        self.assertEqual(str(self.parcel), 'PB-LDH-0001 - Ludhiana Farm')

    def test_case_default_status(self):
        """Test AcquisitionCase defaults to 'PROPOSED'."""
        case = AcquisitionCase.objects.create(
            parcel=self.parcel,
            project_name='Highway Widening',
            purpose='Highway',
            opened_by=self.user,
        )
        self.assertEqual(case.status, 'PROPOSED')


class LandReactSPARouteTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_root_serves_react_spa(self):
        """Test root URL serves React SPA."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('id="root"', response.content.decode('utf-8', errors='ignore'))

    def test_dashboard_route_serves_react_spa(self):
        """Test dashboard URL serves React SPA directly."""
        response = self.client.get(reverse('land:dashboard'))
        self.assertEqual(response.status_code, 200)
        self.assertIn('id="root"', response.content.decode('utf-8', errors='ignore'))


class LandApiPermissionTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.officer_group, _ = Group.objects.get_or_create(name='Officer')
        self.viewer_group, _ = Group.objects.get_or_create(name='Viewer')

        self.viewer = User.objects.create_user(username='viewer_user', password='pass')
        self.viewer.groups.add(self.viewer_group)

        self.officer = User.objects.create_user(username='officer_user', password='pass')
        self.officer.groups.add(self.officer_group)

        self.state = State.objects.create(name='Punjab', code='PB')
        self.parcel = LandParcel.objects.create(
            parcel_id='PB-LDH-0001',
            title='Ludhiana Farm',
            state=self.state,
            district='Ludhiana',
            area_acres=10.0,
            land_type='Agricultural',
            owner_name='Singh',
            market_value=1000000,
            created_by=self.officer,
        )

    def test_parcels_api_returns_200(self):
        """Test parcels JSON API returns 200."""
        self.client.force_login(self.viewer)
        response = self.client.get(reverse('land:api_parcels'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('parcels', data)

    def test_viewer_gets_403_on_parcels_create_api_and_officer_creates_parcel(self):
        """Test Viewer role gets 403 on parcel creation API, while Officer succeeds."""
        parcel_data = {
            'parcel_id': 'PB-AMR-0099',
            'title': 'Amritsar Plot',
            'state_id': self.state.pk,
            'district': 'Amritsar',
            'area_acres': 15.0,
            'land_type': 'Commercial',
            'owner_name': 'Owner A',
            'market_value': 2500000,
        }

        # Viewer attempt -> 403 Forbidden
        self.client.force_login(self.viewer)
        viewer_res = self.client.post(
            reverse('land:api_parcels'),
            data=json.dumps(parcel_data),
            content_type='application/json'
        )
        self.assertEqual(viewer_res.status_code, 403)

        # Officer attempt -> 200 OK
        self.client.force_login(self.officer)
        officer_res = self.client.post(
            reverse('land:api_parcels'),
            data=json.dumps(parcel_data),
            content_type='application/json'
        )
        self.assertEqual(officer_res.status_code, 200)
        self.assertTrue(LandParcel.objects.filter(parcel_id='PB-AMR-0099').exists())


class LandFormValidationTests(TestCase):
    def setUp(self):
        self.state = State.objects.create(name='Maharashtra', code='MH')

    def test_parcel_form_rejects_negative_area(self):
        """Test ParcelForm rejects non-positive area."""
        form_data = {
            'parcel_id': 'MH-MUM-0001',
            'title': 'Plot A',
            'state': self.state.pk,
            'district': 'Mumbai',
            'area_acres': -5.0,
            'land_type': 'Commercial',
            'owner_name': 'Owner Name',
            'market_value': 5000000,
        }
        form = ParcelForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('area_acres', form.errors)

    def test_case_status_form_rejects_invalid_transition(self):
        """Test CaseStatusForm rejects invalid transitions like COMPLETED → PROPOSED."""
        form_data = {
            'new_status': 'PROPOSED',
            'remarks': 'Reopening case',
        }
        form = CaseStatusForm(current_status='COMPLETED', data=form_data)
        self.assertFalse(form.is_valid())


class LandApiAndUrlTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testviewer', password='pass')

    def test_stats_api_returns_json_with_expected_keys(self):
        """Test stats_api returns JSON with expected keys."""
        self.client.force_login(self.user)
        response = self.client.get(reverse('land:stats_api'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/json')
        data = response.json()
        expected_keys = {'total_parcels', 'total_area', 'active_cases', 'total_comp'}
        self.assertTrue(expected_keys.issubset(data.keys()))

    def test_regex_url_parcels_by_state_resolves(self):
        """Test regex URL parcels/state/PB/ resolves correctly."""
        match = resolve('/parcels/state/PB/')
        self.assertEqual(match.view_name, 'land:parcels_by_state')
        self.assertEqual(match.kwargs, {'code': 'PB'})
