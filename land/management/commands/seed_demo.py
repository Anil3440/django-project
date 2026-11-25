"""
Management command to seed demo data.
Syllabus: Django management commands, ORM (insert/create operations)
Run with: python manage.py seed_demo
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from land.models import State, LandParcel, AcquisitionCase, CaseUpdate


class Command(BaseCommand):
    help = 'Seeds the database with demo data for BhoomiTrack'

    def handle(self, *args, **options):
        self.stdout.write('Seeding demo data...')

        # --- Groups and Permissions ---
        # Syllabus: Django groups and permissions
        officer_group, _ = Group.objects.get_or_create(name='Officer')
        viewer_group, _ = Group.objects.get_or_create(name='Viewer')

        # Give Officer: add, change, view on parcel, case, caseupdate
        for model_cls in [LandParcel, AcquisitionCase, CaseUpdate]:
            ct = ContentType.objects.get_for_model(model_cls)
            for action in ['add', 'change', 'view']:
                perm = Permission.objects.filter(content_type=ct, codename__startswith=action).first()
                if perm:
                    officer_group.permissions.add(perm)
        # Give Viewer: view only
        for model_cls in [LandParcel, AcquisitionCase, CaseUpdate]:
            ct = ContentType.objects.get_for_model(model_cls)
            perm = Permission.objects.filter(content_type=ct, codename__startswith='view').first()
            if perm:
                viewer_group.permissions.add(perm)

        # --- Users ---
        # Syllabus: Creating and managing users
        if not User.objects.filter(username='admin').exists():
            admin = User.objects.create_superuser('admin', 'admin@bhoomi.test', 'admin123')
            self.stdout.write('  Created superuser admin/admin123')
        else:
            admin = User.objects.get(username='admin')

        if not User.objects.filter(username='officer1').exists():
            officer1 = User.objects.create_user('officer1', 'officer1@bhoomi.test', 'officer123')
            officer1.groups.add(officer_group)
            officer1.save()
            self.stdout.write('  Created officer1/officer123')
        else:
            officer1 = User.objects.get(username='officer1')

        if not User.objects.filter(username='viewer1').exists():
            viewer1 = User.objects.create_user('viewer1', 'viewer1@bhoomi.test', 'viewer123')
            viewer1.groups.add(viewer_group)
            viewer1.save()
            self.stdout.write('  Created viewer1/viewer123')
        else:
            viewer1 = User.objects.get(username='viewer1')

        # --- States ---
        states_data = [
            ('Punjab', 'PB'), ('Maharashtra', 'MH'), ('Rajasthan', 'RJ'),
            ('Karnataka', 'KA'), ('Gujarat', 'GJ'), ('Uttar Pradesh', 'UP'),
        ]
        states = {}
        for name, code in states_data:
            s, _ = State.objects.get_or_create(code=code, defaults={'name': name})
            states[code] = s

        # --- Parcels ---
        parcels_data = [
            ('PB-LDH-0001', 'Ludhiana Farm Land', 'PB', 'Ludhiana', '45.50', 'Agricultural', 'Gurpreet Singh', '5000000'),
            ('PB-AMR-0001', 'Amritsar Plot', 'PB', 'Amritsar', '12.00', 'Residential', 'Harjit Kaur', '8000000'),
            ('MH-MUM-0001', 'Mumbai Commercial Site', 'MH', 'Mumbai', '5.25', 'Commercial', 'Ramesh Patel', '50000000'),
            ('MH-PUN-0001', 'Pune Forest Land', 'MH', 'Pune', '200.00', 'Forest', 'Maharashtra Govt', '2000000'),
            ('RJ-JAI-0001', 'Jaipur Barren Land', 'RJ', 'Jaipur', '300.00', 'Barren', 'Rajesh Sharma', '3000000'),
            ('RJ-JOD-0001', 'Jodhpur Agricultural', 'RJ', 'Jodhpur', '80.00', 'Agricultural', 'Sunita Devi', '4000000'),
            ('KA-BLR-0001', 'Bangalore Tech Park Site', 'KA', 'Bangalore', '30.00', 'Commercial', 'Infra Corp Ltd', '100000000'),
            ('KA-MYS-0001', 'Mysore Residential Area', 'KA', 'Mysore', '15.00', 'Residential', 'Kavitha Rao', '12000000'),
            ('GJ-AHM-0001', 'Ahmedabad Solar Site', 'GJ', 'Ahmedabad', '500.00', 'Barren', 'Gujarat Solar Ltd', '25000000'),
            ('GJ-SUR-0001', 'Surat Industrial Zone', 'GJ', 'Surat', '100.00', 'Commercial', 'Surat Infra Pvt', '75000000'),
            ('UP-LKO-0001', 'Lucknow Farm', 'UP', 'Lucknow', '60.00', 'Agricultural', 'Ram Prasad', '6000000'),
            ('UP-AGR-0001', 'Agra Residential Plot', 'UP', 'Agra', '8.00', 'Residential', 'Meena Gupta', '9000000'),
            ('MH-NAG-0001', 'Nagpur Forest Reserve', 'MH', 'Nagpur', '400.00', 'Forest', 'Forest Dept MH', '8000000'),
            ('PB-PAT-0001', 'Patiala Commercial', 'PB', 'Patiala', '20.00', 'Commercial', 'Patiala Traders', '15000000'),
            ('KA-HUB-0001', 'Hubli Agricultural', 'KA', 'Hubli', '55.00', 'Agricultural', 'Basavanna Patil', '5500000'),
        ]
        parcels = {}
        for pid, title, state_code, district, area, ltype, owner, mval in parcels_data:
            p, _ = LandParcel.objects.get_or_create(
                parcel_id=pid,
                defaults={
                    'title': title, 'state': states[state_code], 'district': district,
                    'area_acres': area, 'land_type': ltype, 'owner_name': owner,
                    'market_value': mval, 'created_by': officer1,
                }
            )
            parcels[pid] = p

        # --- Cases ---
        cases_data = [
            ('PB-LDH-0001', 'NH-44 Widening Project', 'Highway', 'COMPLETED', '7500000'),
            ('PB-AMR-0001', 'Amritsar Railway Expansion', 'Railway', 'COMPENSATION_PAID', '12000000'),
            ('MH-MUM-0001', 'Mumbai Metro Line 7', 'Public Building', 'APPROVED', '75000000'),
            ('MH-PUN-0001', 'Pune Solar Park Phase 1', 'Solar Park', 'UNDER_REVIEW', None),
            ('RJ-JAI-0001', 'Rajasthan Industrial Corridor', 'Industrial', 'PROPOSED', None),
            ('GJ-AHM-0001', 'Gujarat Solar Mission', 'Solar Park', 'UNDER_REVIEW', None),
            ('KA-BLR-0001', 'Bangalore Peripheral Ring Road', 'Highway', 'REJECTED', None),
            ('UP-LKO-0001', 'Lucknow-Agra Expressway', 'Highway', 'PROPOSED', None),
        ]
        created_cases = []
        for pid, proj, purpose, status, comp in cases_data:
            c, created = AcquisitionCase.objects.get_or_create(
                parcel=parcels[pid], project_name=proj,
                defaults={
                    'purpose': purpose, 'status': status,
                    'compensation_amount': comp, 'opened_by': officer1,
                }
            )
            created_cases.append(c)

        # --- CaseUpdates for the COMPLETED case ---
        completed_case = created_cases[0]
        updates = [
            ('PROPOSED', 'UNDER_REVIEW', 'Initial review started'),
            ('UNDER_REVIEW', 'APPROVED', 'Approved by district collector'),
            ('APPROVED', 'COMPENSATION_PAID', 'Compensation of Rs 75 lakh disbursed'),
            ('COMPENSATION_PAID', 'COMPLETED', 'Land handed over. Project complete.'),
        ]
        for old, new, rem in updates:
            CaseUpdate.objects.get_or_create(
                case=completed_case, old_status=old, new_status=new,
                defaults={'remarks': rem, 'updated_by': officer1}
            )

        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully!'))
        self.stdout.write('  Logins: admin/admin123, officer1/officer123, viewer1/viewer123')

