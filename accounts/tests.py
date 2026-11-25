"""
Tests for accounts app.
Testing authentication APIs, User creation, and Groups.
"""
from django.test import TestCase, Client
from django.contrib.auth.models import User, Group
from django.urls import reverse
import json


class AccountsAuthTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Ensure Viewer group exists
        Group.objects.get_or_create(name='Viewer')

    def test_signup_creates_user_and_assigns_viewer_group(self):
        """Test signup creates user and automatically assigns Viewer group."""
        payload = {
            'username': 'newcitizen',
            'email': 'citizen@example.com',
            'password': 'StrongPass123!',
        }
        response = self.client.post(
            reverse('api_auth_signup'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(User.objects.filter(username='newcitizen').exists())
        user = User.objects.get(username='newcitizen')
        self.assertTrue(user.groups.filter(name='Viewer').exists())

    def test_login_and_logout(self):
        """Test login and logout via JSON API."""
        User.objects.create_user(username='testuser', password='password123')
        payload = {'username': 'testuser', 'password': 'password123'}
        login_response = self.client.post(
            reverse('api_auth_login'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(login_response.status_code, 200)
        data = login_response.json()
        self.assertTrue(data.get('success'))

        # Logout via POST
        logout_response = self.client.post(reverse('api_auth_logout'))
        self.assertEqual(logout_response.status_code, 200)
