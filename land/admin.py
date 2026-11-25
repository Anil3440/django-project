from django.contrib import admin
from .models import State, LandParcel, AcquisitionCase, CaseUpdate

@admin.register(State)
class StateAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')

@admin.register(LandParcel)
class LandParcelAdmin(admin.ModelAdmin):
    # Syllabus: Django Admin - list_display, list_filter, search_fields
    list_display = ('parcel_id', 'title', 'state', 'area_acres', 'land_type', 'owner_name')
    list_filter = ('state', 'land_type')
    search_fields = ('parcel_id', 'title', 'owner_name', 'district')

@admin.register(AcquisitionCase)
class AcquisitionCaseAdmin(admin.ModelAdmin):
    list_display = ('project_name', 'parcel', 'purpose', 'status', 'opened_by', 'created_at')
    list_filter = ('status', 'purpose')
    search_fields = ('project_name', 'parcel__parcel_id')

@admin.register(CaseUpdate)
class CaseUpdateAdmin(admin.ModelAdmin):
    list_display = ('case', 'old_status', 'new_status', 'updated_by', 'timestamp')
    readonly_fields = ('case', 'old_status', 'new_status', 'updated_by', 'timestamp')
