"""
Forms for the land app.
Syllabus: Building forms in Django - ModelForm, Form, GET vs POST forms, data validation.
"""
import re
from django import forms
from django.core.exceptions import ValidationError
from .models import LandParcel, AcquisitionCase, State


class ParcelForm(forms.ModelForm):
    """
    Form for creating and editing land parcels.
    Syllabus: ModelForm, clean_<field> validation, widget customization.
    """
    class Meta:
        model = LandParcel
        fields = ['parcel_id', 'title', 'state', 'district', 'area_acres',
                  'land_type', 'owner_name', 'market_value']
        widgets = {
            'parcel_id': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. PB-LDH-0001'}),
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'state': forms.Select(attrs={'class': 'form-select'}),
            'district': forms.TextInput(attrs={'class': 'form-control'}),
            'area_acres': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'land_type': forms.Select(attrs={'class': 'form-select'}),
            'owner_name': forms.TextInput(attrs={'class': 'form-control'}),
            'market_value': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
        }

    def clean_parcel_id(self):
        """
        Validates parcel_id format: XX-XXX-0000 (e.g. PB-LDH-0001).
        Syllabus: clean_<field> method, regex validation.
        """
        parcel_id = self.cleaned_data.get('parcel_id', '').strip().upper()
        pattern = r'^[A-Z]{2}-[A-Z]{3}-\d{4}$'
        if not re.match(pattern, parcel_id):
            raise ValidationError(
                "Invalid format. Use XX-XXX-0000 (e.g. PB-LDH-0001) with uppercase letters."
            )
        return parcel_id

    def clean_area_acres(self):
        """Area must be greater than 0. Syllabus: clean_<field> validation."""
        area = self.cleaned_data.get('area_acres')
        if area is not None and area <= 0:
            raise ValidationError("Area must be greater than 0 acres.")
        return area

    def clean_market_value(self):
        """Market value must be greater than 0. Syllabus: clean_<field> validation."""
        value = self.cleaned_data.get('market_value')
        if value is not None and value <= 0:
            raise ValidationError("Market value must be greater than 0.")
        return value


class CaseForm(forms.ModelForm):
    """
    Form for creating a new acquisition case.
    Syllabus: ModelForm, clean() for cross-field validation.
    """
    class Meta:
        model = AcquisitionCase
        fields = ['parcel', 'project_name', 'purpose']
        widgets = {
            'parcel': forms.Select(attrs={'class': 'form-select'}),
            'project_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. NH-44 Widening'}),
            'purpose': forms.Select(attrs={'class': 'form-select'}),
        }

    def clean(self):
        """
        Block creating a new case for a parcel that already has an active case.
        Syllabus: clean() method for cross-field/multi-field validation.
        """
        cleaned_data = super().clean()
        parcel = cleaned_data.get('parcel')
        if parcel:
            active_statuses = ['PROPOSED', 'UNDER_REVIEW', 'APPROVED', 'COMPENSATION_PAID']
            if parcel.cases.filter(status__in=active_statuses).exists():
                raise ValidationError(
                    f"Parcel {parcel.parcel_id} already has an active acquisition case. "
                    "Complete or reject it before opening a new one."
                )
        return cleaned_data


class CaseStatusForm(forms.Form):
    """
    Form to update the status of an acquisition case.
    Syllabus: forms.Form (not ModelForm), ChoiceField, conditional validation.
    """
    new_status = forms.ChoiceField(
        choices=AcquisitionCase.STATUS_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    compensation_amount = forms.DecimalField(
        required=False,
        min_value=0,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'placeholder': 'Amount in ₹'})
    )
    remarks = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Enter remarks...'})
    )

    def __init__(self, current_status, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.current_status = current_status
        # Only show valid next statuses
        valid_next = AcquisitionCase.VALID_TRANSITIONS.get(current_status, [])
        self.fields['new_status'].choices = [
            (s, label) for s, label in AcquisitionCase.STATUS_CHOICES if s in valid_next
        ]

    def clean(self):
        """
        Enforce status workflow transitions.
        Require compensation_amount when moving to APPROVED.
        Syllabus: clean() validation, business logic enforcement.
        """
        cleaned_data = super().clean()
        new_status = cleaned_data.get('new_status')
        compensation = cleaned_data.get('compensation_amount')

        # Validate transition
        valid_next = AcquisitionCase.VALID_TRANSITIONS.get(self.current_status, [])
        if new_status and new_status not in valid_next:
            raise ValidationError(
                f"Invalid transition: {self.current_status} → {new_status}. "
                f"Allowed: {', '.join(valid_next) or 'none'}"
            )

        # Require compensation when approving
        if new_status == 'APPROVED' and not compensation:
            raise ValidationError("Compensation amount is required when approving a case.")

        return cleaned_data


class ParcelSearchForm(forms.Form):
    """
    GET-based search/filter form for parcel list.
    Syllabus: GET form (no CSRF needed), optional fields.
    """
    q = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Search parcel ID, title, owner...'})
    )
    state = forms.ModelChoiceField(
        queryset=State.objects.all().order_by('name'),
        required=False,
        empty_label='All States',
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    land_type = forms.ChoiceField(
        choices=[('', 'All Types')] + LandParcel.LAND_TYPE_CHOICES,
        required=False,
        widget=forms.Select(attrs={'class': 'form-select'})
    )
