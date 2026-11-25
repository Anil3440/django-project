import logging
from django.db import models
from django.contrib.auth.models import User

logger = logging.getLogger(__name__)

# Syllabus: Creating Models - State stores Indian state info
class State(models.Model):
    name = models.CharField(max_length=60, unique=True)
    code = models.CharField(max_length=2, unique=True)  # e.g. PB, MH

    def __str__(self):
        return f"{self.name} ({self.code})"

# Syllabus: ForeignKey relationship - LandParcel belongs to a State and a User
class LandParcel(models.Model):
    LAND_TYPE_CHOICES = [
        ('Agricultural', 'Agricultural'),
        ('Residential', 'Residential'),
        ('Commercial', 'Commercial'),
        ('Forest', 'Forest'),
        ('Barren', 'Barren'),
    ]
    parcel_id = models.CharField(max_length=20, unique=True)  # e.g. PB-LDH-0001
    title = models.CharField(max_length=200)
    state = models.ForeignKey(State, on_delete=models.PROTECT, related_name='parcels')
    district = models.CharField(max_length=100)
    area_acres = models.DecimalField(max_digits=10, decimal_places=2)
    land_type = models.CharField(max_length=20, choices=LAND_TYPE_CHOICES)
    owner_name = models.CharField(max_length=200)
    market_value = models.DecimalField(max_digits=15, decimal_places=2)  # in rupees
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='parcels')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.parcel_id} - {self.title}"

# Syllabus: Multiple ForeignKeys, choices field - AcquisitionCase links parcel to a government project
class AcquisitionCase(models.Model):
    PURPOSE_CHOICES = [
        ('Highway', 'Highway'),
        ('Railway', 'Railway'),
        ('Solar Park', 'Solar Park'),
        ('Industrial', 'Industrial'),
        ('Public Building', 'Public Building'),
    ]
    STATUS_CHOICES = [
        ('PROPOSED', 'Proposed'),
        ('UNDER_REVIEW', 'Under Review'),
        ('APPROVED', 'Approved'),
        ('COMPENSATION_PAID', 'Compensation Paid'),
        ('COMPLETED', 'Completed'),
        ('REJECTED', 'Rejected'),
    ]
    # Valid forward transitions (syllabus: data validation logic)
    VALID_TRANSITIONS = {
        'PROPOSED': ['UNDER_REVIEW', 'REJECTED'],
        'UNDER_REVIEW': ['APPROVED', 'REJECTED'],
        'APPROVED': ['COMPENSATION_PAID'],
        'COMPENSATION_PAID': ['COMPLETED'],
        'COMPLETED': [],
        'REJECTED': [],
    }

    parcel = models.ForeignKey(LandParcel, on_delete=models.PROTECT, related_name='cases')
    project_name = models.CharField(max_length=200)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PROPOSED')
    compensation_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    opened_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='cases')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.project_name} - {self.parcel.parcel_id} ({self.status})"

# Syllabus: Audit log pattern - CaseUpdate records every status change
class CaseUpdate(models.Model):
    case = models.ForeignKey(AcquisitionCase, on_delete=models.CASCADE, related_name='updates')
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    remarks = models.TextField()
    updated_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='case_updates')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Case #{self.case_id}: {self.old_status} -> {self.new_status} by {self.updated_by}"
