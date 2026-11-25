"""
URL configuration for bhoomitrack project.
Pure React SPA Frontend + Django JSON API Backend + Django Admin.
Zero DTL: All web traffic serves the React SPA directly.
"""
from django.contrib import admin
from django.conf import settings
from django.views.static import serve
from django.urls import path, include, re_path
from accounts import api_views as accounts_api
from land import views as land_views
from land import api_views as land_api

urlpatterns = [
    # Static build assets for React
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR / 'frontend' / 'dist' / 'assets'}),

    # Django Admin Panel
    path('admin/', admin.site.urls),

    # JSON Authentication APIs
    path('api/auth/me/', accounts_api.api_me, name='api_auth_me'),
    path('api/auth/login/', accounts_api.api_login, name='api_auth_login'),
    path('api/auth/signup/', accounts_api.api_signup, name='api_auth_signup'),
    path('api/auth/logout/', accounts_api.api_logout, name='api_auth_logout'),

    # Admin User Management APIs
    path('api/admin/users/', accounts_api.api_admin_users, name='api_admin_users'),
    path('api/admin/users/<int:user_id>/set-role/', accounts_api.api_admin_set_role, name='api_admin_set_role'),

    # Domain JSON APIs
    path('api/dashboard/', land_api.api_dashboard, name='api_dashboard'),
    path('api/stats/', land_views.stats_api, name='stats_api'),
    path('api/states/', land_api.api_states, name='api_states'),
    path('api/parcels/', land_api.api_parcels, name='api_parcels'),
    path('api/parcels/<int:pk>/', land_api.api_parcel_detail, name='api_parcel_detail'),
    path('api/cases/', land_api.api_cases, name='api_cases'),
    path('api/cases/<int:pk>/', land_api.api_case_detail, name='api_case_detail'),
    path('api/cases/<int:pk>/update-status/', land_api.api_case_update_status, name='api_case_update_status'),

    # Domain routes & accounts
    path('accounts/', include('accounts.urls')),
    path('', include('land.urls')),

    # React SPA Catch-all: Any unmatched web route serves the React SPA directly!
    re_path(r'^.*$', land_views.react_app, name='react_spa'),
]
