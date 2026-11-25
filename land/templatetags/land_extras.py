# Syllabus: Custom template tags/filters
from django import template

register = template.Library()

@register.filter
def status_color(status):
    """Returns a Bootstrap color class for a given case status."""
    colors = {
        'PROPOSED': 'secondary',
        'UNDER_REVIEW': 'primary',
        'APPROVED': 'success',
        'COMPENSATION_PAID': 'info',
        'COMPLETED': 'success',
        'REJECTED': 'danger',
    }
    return colors.get(status, 'secondary')
