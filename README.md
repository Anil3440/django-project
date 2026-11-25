# BhoomiTrack 🌾
**Real-Time National Land Acquisition & Management System for End-to-End Digital Monitoring and Decision Support**

A clean, full-stack Django web portal where government officers record **land parcels** and manage **acquisition cases** (for highways, railways, solar parks, industrial corridors, and public buildings) through an enforced digital workflow. The system features real-time decision-support statistics, audit trail tracking, role-based access control, session & cookie state management, and custom error handling.

---

## 1. Features

- **Decision-Support Dashboard**: Live statistical summary cards (total parcels, total acres, active cases, compensation paid) with **10-second AJAX polling** via vanilla JavaScript `fetch()`.
- **End-to-End Acquisition Workflow**:
  ```
  PROPOSED → UNDER_REVIEW → APPROVED → COMPENSATION_PAID → COMPLETED
                      ↘ REJECTED
  ```
  State machine transitions are strictly validated in forms. Backward moves are prevented.
- **Audit Logging (`CaseUpdate`)**: Every status change automatically logs the previous status, new status, timestamp, author, and official remarks.
- **Role-Based Access Control (RBAC)**:
  - **Admin** (Superuser): Full access + Django Admin panel (`/admin/`) + delete permissions.
  - **Land Officer** (`Officer` Group): Create & edit parcels, open acquisition cases, advance case workflow.
  - **Viewer / Citizen** (`Viewer` Group): Read-only access to parcels, cases, and dashboard. (New signups automatically join `Viewer`).
- **Smart Search & Filters**:
  - Full-text keyword search across Parcel ID, title, and owner.
  - Filter by State and Land Type.
  - Regex-based URL routing (`/parcels/state/<2-letter-code>/`, `/cases/year/<4-digit-year>/`).
- **Session & Cookie Tracking**:
  - **Recently Viewed Parcels**: Tracked in `request.session['recent_parcels']` (last 5 viewed items displayed in the sidebar and profile).
  - **Dashboard Visit Counter**: Tracked in `request.session['visits']`.
  - **Persistent State Filter Cookie**: Remembers the officer's selected state filter in `request.COOKIES['last_state']` for 7 days.
- **Security & CSRF Protection**: All POST actions use `{% csrf_token %}` and follow the **POST → Redirect → GET** pattern.

---

## 2. Setup & Installation

### Prerequisites
- Python 3.10+ (tested on Python 3.11)
- Node.js 18+ & npm (for React frontend)

### Installation Steps

```powershell
# 1. Activate Python virtual environment and run backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

### Running the React Frontend

You have two easy ways to experience the attractive React frontend:

#### Option A: Production Build via Django (Single Server)
The React app is pre-built inside `frontend/dist/`. Simply opening `http://127.0.0.1:8000/` in your browser serves the React app directly through Django!

#### Option B: Live Vite Dev Server (Hot-Reloading)
In a separate terminal window:
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000/` (requests to `/api/...` are automatically proxied to Django).


---

## 3. Demo Logins

The `seed_demo` command creates three test accounts covering all user roles:

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Superuser: All permissions + Django Admin (`/admin/`) |
| **Land Officer** | `officer1` | `officer123` | `Officer` group: Create & edit parcels/cases |
| **Viewer / Citizen** | `viewer1` | `viewer123` | `Viewer` group: Read-only access |

---

## 4. Project Structure

```
bhoomitrack/
├── manage.py
├── requirements.txt
├── README.md
├── plan (1).md
├── db.sqlite3
├── bhoomitrack/              # Project settings & root routing
│   ├── settings.py           # Apps, DB config, session/cookie ages, logging
│   ├── urls.py               # Root URLs & custom 403/404/500 handlers
│   ├── wsgi.py
│   └── asgi.py
├── accounts/                 # Authentication & User Profile
│   ├── forms.py              # SignupForm (UserCreationForm) & LoginForm
│   ├── views.py              # signup, login, logout (POST), profile
│   ├── urls.py
│   └── tests.py              # Auth & session tests
├── land/                     # Core Domain App
│   ├── models.py             # State, LandParcel, AcquisitionCase, CaseUpdate
│   ├── forms.py              # ParcelForm, CaseForm, CaseStatusForm, ParcelSearchForm
│   ├── views.py              # FBVs for dashboard, parcels, cases, stats_api
│   ├── urls.py               # Standard & regex URL patterns
│   ├── admin.py              # ModelAdmin with filters & search
│   ├── tests.py              # Comprehensive test suite (11 tests)
│   ├── templatetags/
│   │   └── land_extras.py    # Custom status_color filter
│   └── management/commands/
│       └── seed_demo.py      # Management command to populate sample data
├── templates/                # Django Template Language (DTL)
│   ├── base.html             # Responsive Bootstrap 5 layout
│   ├── 403.html              # Custom Forbidden error page
│   ├── 404.html              # Custom Not Found error page
│   ├── 500.html              # Custom Server Error page
│   ├── accounts/
│   │   ├── login.html
│   │   ├── signup.html
│   │   └── profile.html
│   └── land/
│       ├── dashboard.html    # Real-time AJAX dashboard
│       ├── parcel_list.html  # Searchable & filterable table
│       ├── parcel_detail.html
│       ├── parcel_form.html
│       ├── parcel_confirm_delete.html
│       ├── case_list.html
│       ├── case_detail.html  # Timeline view of case updates
│       ├── case_form.html
│       ├── case_status_form.html
│       ├── about.html
│       └── _status_badge.html
└── static/
    └── css/
        └── style.css         # Custom responsive styles & badges
```

---

## 5. Syllabus Coverage Checklist

| Unit | Topic | Where it is demonstrated in code |
|---|---|---|
| **Unit II: Views and URLs** | Creating views and mapping to URLs | `land/views.py`, `land/urls.py`, `accounts/urls.py` |
| | HTTP requests and responses | `request.GET`, `request.POST`, `render()`, `redirect()`, `HttpResponse`, `JsonResponse` |
| | URLs with parameters | `parcels/<int:pk>/`, `cases/<int:pk>/` |
| | Regular expressions in URLs | `re_path(r'^parcels/state/(?P<code>[A-Z]{2})/$', ...)` and `re_path(r'^cases/year/(?P<year>[0-9]{4})/$', ...)` |
| | Error handling | Custom `403.html`, `404.html`, `500.html` and `handler404/403/500` in `bhoomitrack/urls.py` |
| **Unit III: Templates, Debugging, Testing** | Creating templates, DTL tags & variables | All templates in `templates/` using `{{ var }}`, `{% url %}`, `{% static %}` |
| | For loops and If-Else branching | Lists with `{% for %}` and `{% empty %}`, auth state in navbar |
| | Template inheritance & includes | `{% extends 'base.html' %}`, `{% block %}`, `{% include 'land/_status_badge.html' %}` |
| | Debugging | Console `LOGGING` in `settings.py`, Django Debug error pages (`DEBUG=True`), Django shell |
| | Testing | Unit test suites in `land/tests.py` and `accounts/tests.py` using `TestCase` and `Client` |
| **Unit IV: Forms** | GET vs POST forms | Search form (`method="get"`), Create/Edit/Delete forms (`method="post"`) |
| | Building forms in Django | `ParcelForm(ModelForm)`, `CaseForm(ModelForm)`, `CaseStatusForm(Form)`, `SignupForm(UserCreationForm)` |
| | CSRF Protection | `{% csrf_token %}` in all POST forms + `CsrfViewMiddleware` |
| | POST → Redirect → GET pattern | Views redirect on valid POST; flash success message shown on next GET |
| | Form validation | `clean_parcel_id()`, `clean_area_acres()`, cross-field `clean()` for workflow status transitions |
| **Unit V: Models, Migrations, Admin** | Creating models & migrations | 4 models in `land/models.py`, `makemigrations` and `migrate` |
| | Django ORM operations | Insert, update, delete in views and shell; ORM aggregation (`Sum`, `Count`, `annotate`) |
| | Foreign Keys & Relationships | `LandParcel → State`, `AcquisitionCase → LandParcel`, `CaseUpdate → AcquisitionCase` |
| | Django Admin & Groups/Permissions | `land/admin.py` with `list_display`, `list_filter`, `search_fields`; `Officer` & `Viewer` groups |
| | Database configuration | SQLite configuration in `bhoomitrack/settings.py` |
| **Unit VI: Cookies, Sessions, Auth** | Cookies | `response.set_cookie('last_state', ...)` and `response.delete_cookie()` in `parcel_list` / `clear_cookie` |
| | Sessions | `request.session['visits']` and `request.session['recent_parcels']` |
| | User Management | `signup_view`, Django Admin user management, automatic group assignment |
| | Login, Logout & Auth decorators | `authenticate()`, `login()`, `logout()`, `@login_required`, `@officer_required`, `LOGIN_URL` |

---

## 6. Django Shell Examples (ORM Demo)

You can demonstrate ORM queries live during your presentation using `python manage.py shell`:

```python
# Open the Django shell:
# python manage.py shell

from land.models import State, LandParcel, AcquisitionCase
from django.contrib.auth.models import User
from decimal import Decimal

# 1. READ / QUERY
pb = State.objects.get(code='PB')
parcels = LandParcel.objects.filter(state=pb)
print(f"Parcels in Punjab: {parcels.count()}")

# 2. INSERT / CREATE
officer = User.objects.get(username='officer1')
new_parcel = LandParcel.objects.create(
    parcel_id='PB-MHL-0099',
    title='Mohali IT Park Extension',
    state=pb,
    district='Mohali',
    area_acres=Decimal('15.75'),
    land_type='Commercial',
    owner_name='Punjab State Industries',
    market_value=Decimal('45000000.00'),
    created_by=officer
)
print("Created:", new_parcel)

# 3. UPDATE
new_parcel.market_value = Decimal('48000000.00')
new_parcel.save()
print("Updated value:", new_parcel.market_value)

# 4. AGGREGATION & ANNOTATION
from django.db.models import Sum, Count
total_acres = LandParcel.objects.aggregate(total=Sum('area_acres'))['total']
print("Total Acres across India:", total_acres)

cases_count = AcquisitionCase.objects.values('status').annotate(total=Count('id'))
for c in cases_count:
    print(c['status'], "->", c['total'])

# 5. DELETE
new_parcel.delete()
print("Deleted successfully!")
```

---

## 7. Running Tests

Run the complete test suite:

```powershell
python manage.py test
```

Expected output:
```
Found 11 test(s).
Creating test database for alias 'default'...
...........
----------------------------------------------------------------------
Ran 11 tests in 5.398s

OK
Destroying test database for alias 'default'...
```

The test suite validates:
1. `LandParcel.__str__` representation
2. `AcquisitionCase` default status (`PROPOSED`)
3. `dashboard` redirects anonymous visitors to `/accounts/login/`
4. `parcel_list` returns status `200` for logged-in users
5. `Viewer` group member gets `403 Forbidden` on `/parcels/add/`
6. `Officer` group member gets `200 OK` on `/parcels/add/`
7. `ParcelForm` rejects negative `area_acres`
8. `CaseStatusForm` rejects illegal backward status transitions (e.g. `COMPLETED → PROPOSED`)
9. User signup automatically assigns user to the `Viewer` group
10. `stats_api` returns valid JSON with all required metric keys
11. Regex URL `/parcels/state/PB/` resolves to `land:parcels_by_state` with `code='PB'`

---

## 8. Debugging & Error Pages Demonstration

1. **Custom Error Pages (`403.html`, `404.html`, `500.html`)**:
   - In `bhoomitrack/settings.py`, temporarily set `DEBUG = False`.
   - Access a non-existent URL (e.g. `http://127.0.0.1:8000/non-existent-page/`) to see the custom `404.html`.
   - Log in as `viewer1` and visit `http://127.0.0.1:8000/parcels/add/` to see the custom `403.html`.
   - Remember to set `DEBUG = True` back for regular development.
2. **Console Logging**:
   - Status changes and actions are logged to the console using Python's `logging` module configured in `settings.py`.

