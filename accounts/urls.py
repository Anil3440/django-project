from django.urls import path
from . import api_views
from land import views as land_views

app_name = 'accounts'

urlpatterns = [
    # In a pure React SPA architecture, all account web routes serve the React SPA directly!
    path('login/', land_views.react_app, name='login'),
    path('signup/', land_views.react_app, name='signup'),
    path('profile/', land_views.react_app, name='profile'),
    path('logout/', api_views.api_logout, name='logout'),

    # JSON API endpoints for modern React frontend
    path('api/me/', api_views.api_me, name='api_me'),
    path('api/login/', api_views.api_login, name='api_login'),
    path('api/signup/', api_views.api_signup, name='api_signup'),
    path('api/logout/', api_views.api_logout, name='api_logout'),
]
