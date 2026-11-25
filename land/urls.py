"""
land/urls.py - URL configuration for the land app.
Pure React SPA frontend + Django JSON API backend.
All web pages serve the modern React SPA directly.
"""
from django.urls import path, re_path
from . import views
from . import api_views

app_name = 'land'

urlpatterns = [
    # JSON APIs for React Frontend
    path('api/dashboard/', api_views.api_dashboard, name='api_dashboard'),
    path('api/stats/', views.stats_api, name='stats_api'),
    path('api/states/', api_views.api_states, name='api_states'),
    path('api/parcels/', api_views.api_parcels, name='api_parcels'),
    path('api/parcels/<int:pk>/', api_views.api_parcel_detail, name='api_parcel_detail'),
    path('api/cases/', api_views.api_cases, name='api_cases'),
    path('api/cases/<int:pk>/', api_views.api_case_detail, name='api_case_detail'),
    path('api/cases/<int:pk>/update-status/', api_views.api_case_update_status, name='api_case_update_status'),

    # React SPA Web Routes: Zero DTL - All views serve the React SPA directly
    path('dashboard/', views.react_app, name='dashboard'),
    path('parcels/', views.react_app, name='parcel_list'),
    path('parcels/add/', views.react_app, name='parcel_create'),
    path('parcels/<int:pk>/', views.react_app, name='parcel_detail'),
    path('parcels/<int:pk>/edit/', views.react_app, name='parcel_edit'),
    path('parcels/<int:pk>/delete/', views.react_app, name='parcel_delete'),
    re_path(r'^parcels/state/(?P<code>[A-Z]{2})/$', views.react_app, name='parcels_by_state'),
    path('cases/', views.react_app, name='case_list'),
    path('cases/add/', views.react_app, name='case_create'),
    re_path(r'^cases/year/(?P<year>[0-9]{4})/$', views.react_app, name='cases_by_year'),
    path('cases/<int:pk>/', views.react_app, name='case_detail'),
    path('cases/<int:pk>/update/', views.react_app, name='case_update_status'),
    path('about/', views.react_app, name='about'),
]
