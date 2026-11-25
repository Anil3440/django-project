# PLAN.md: BhoomiTrack
**Real-Time National Land Acquisition & Management System for End-to-End Digital Monitoring and Decision Support**

> Instructions for the AI agent (Antigravity): Build this project exactly as described. This is a **college Django project** that the student must **explain and present**, so the code must stay **simple, readable and well commented**. Do NOT over-engineer.

---

## 0. Ground Rules (read first)

1. **Stack:** Python 3, Django (latest stable 5.x), **SQLite** (default `db.sqlite3`), Django Templates (DTL), Bootstrap 5 via CDN, a little vanilla JavaScript.
2. **Use function-based views (FBVs)** everywhere. No class-based views, no Django REST Framework, no Channels/WebSockets, no Celery, no Docker.
3. **"Real-time" is done with simple AJAX polling:** the dashboard calls a JSON endpoint every 10 seconds with `fetch()` and updates the numbers. No extra libraries.
4. **Keep it small:** 3 apps, 4 models, about 12 pages. Add short comments on every view and model explaining *what* and *why*, and which syllabus topic it demonstrates.
5. Every syllabus topic in Section 10 must be visibly demonstrated in the code.
6. Create a `requirements.txt` containing only `Django`.
7. Create a `README.md` with setup steps and demo logins.
8. Work in the phases of Section 9, and make sure the app runs after each phase.

---

## 1. Project Overview

A web portal where government officers record **land parcels** and manage **acquisition cases** (for highways, railways, solar parks and so on) through a clear workflow. Officers track progress, and the dashboard shows live statistics for decision-making. Citizens or viewers can see public parcel and case status.

### User Roles (implemented with Django Groups)
| Role | Group name | Can do |
|---|---|---|
| Admin | superuser | Everything, plus the Django Admin panel |
| Land Officer | `Officer` | Add and edit parcels, create cases, update case status |
| Viewer / Citizen | `Viewer` | Read-only access to the parcel list, case list and dashboard |

New signups are automatically placed in the `Viewer` group. Admin promotes users to `Officer` from Django Admin.

---

## 2. Project Setup

```
bhoomitrack/                  # project root
├── manage.py
├── requirements.txt
├── README.md
├── bhoomitrack/              # project config
│   ├── settings.py
│   ├── urls.py
│   └── ...
├── accounts/                 # app 1: signup, login, logout, profile, cookies/sessions
├── land/                     # app 2: parcels, cases, workflow, dashboard
├── templates/                # global templates folder
│   ├── base.html
│   ├── 404.html
│   ├── 403.html
│   ├── 500.html
│   ├── accounts/
│   └── land/
└── static/
    └── css/style.css
```

Commands the agent should run:
```
python -m venv venv
pip install django
django-admin startproject bhoomitrack .
python manage.py startapp accounts
python manage.py startapp land
```

### settings.py essentials
- Add `accounts` and `land` to `INSTALLED_APPS`.
- `TEMPLATES['DIRS'] = [BASE_DIR / 'templates']`
- `STATICFILES_DIRS = [BASE_DIR / 'static']`
- Database: default **SQLite** with a comment explaining the configuration (*syllabus: database configuration*).
- `LOGIN_URL = 'accounts:login'`
- `LOGIN_REDIRECT_URL = 'land:dashboard'`
- `LOGOUT_REDIRECT_URL = 'accounts:login'`
- `SESSION_COOKIE_AGE = 60 * 60 * 24` (1 day)
- `django.contrib.messages` enabled (used for flash messages)
- Keep `CsrfViewMiddleware` enabled (it is by default).
- Add a simple `LOGGING` config that prints to the console (*syllabus: debugging*).

---

## 3. Database Models (SQLite)

### `land/models.py`

**State**
| Field | Type |
|---|---|
| name | CharField(max_length=60, unique) |
| code | CharField(max_length=2, unique) (e.g. `PB`, `MH`) |

**LandParcel**
| Field | Type |
|---|---|
| parcel_id | CharField(unique) (e.g. `PB-LDH-0001`) |
| title | CharField |
| state | **ForeignKey → State** |
| district | CharField |
| area_acres | DecimalField (must be > 0) |
| land_type | CharField with choices: Agricultural, Residential, Commercial, Forest, Barren |
| owner_name | CharField |
| market_value | DecimalField (in ₹) |
| created_by | **ForeignKey → User** |
| created_at | DateTimeField(auto_now_add) |

**AcquisitionCase**
| Field | Type |
|---|---|
| parcel | **ForeignKey → LandParcel** (related_name=`cases`) |
| project_name | CharField (e.g. "NH-44 Widening") |
| purpose | CharField with choices: Highway, Railway, Solar Park, Industrial, Public Building |
| status | CharField with choices (see workflow below) |
| compensation_amount | DecimalField (null/blank until approved) |
| opened_by | **ForeignKey → User** |
| created_at / updated_at | DateTimeField |

**CaseUpdate** (history log, gives the "end-to-end monitoring" feature)
| Field | Type |
|---|---|
| case | **ForeignKey → AcquisitionCase** (related_name=`updates`) |
| old_status / new_status | CharField |
| remarks | TextField |
| updated_by | **ForeignKey → User** |
| timestamp | DateTimeField(auto_now_add) |

### Case status workflow
```
PROPOSED → UNDER_REVIEW → APPROVED → COMPENSATION_PAID → COMPLETED
                    ↘ REJECTED
```
Only forward moves are allowed (validated in the form, see Section 6). `REJECTED` is allowed from `PROPOSED` or `UNDER_REVIEW` only.

### accounts model
Use Django's built-in `User`. Do not create a custom user model. Optionally add a tiny `Profile` model (`user` OneToOne, `department`, `phone`). This is optional; skip it if it adds complexity.

Add `__str__` to every model. Run `makemigrations` and `migrate`.

---

## 4. URLs and Views

### Project `urls.py`
```python
path('admin/', admin.site.urls),
path('accounts/', include('accounts.urls')),
path('', include('land.urls')),
handler404 = 'land.views.custom_404'
handler403 = 'land.views.custom_403'
handler500 = 'land.views.custom_500'
```

### `accounts/urls.py` (`app_name = 'accounts'`)
| URL | View | Purpose |
|---|---|---|
| `signup/` | `signup_view` | Register new user (POST + redirect) |
| `login/` | `login_view` | Login with `authenticate()` + `login()` |
| `logout/` | `logout_view` | Logout (POST only) |
| `profile/` | `profile_view` | Shows user info, session visit count, recently viewed parcels |

### `land/urls.py` (`app_name = 'land'`)
| URL | View | Notes |
|---|---|---|
| `` | `dashboard` | Stats cards + charts-lite + recent updates (login required) |
| `api/stats/` | `stats_api` | Returns `JsonResponse` for real-time polling |
| `parcels/` | `parcel_list` | GET search/filter form (`?q=&state=&land_type=`) |
| `parcels/add/` | `parcel_create` | Officer only; Django form, POST |
| `parcels/<int:pk>/` | `parcel_detail` | **URL param**; adds to the "recently viewed" session list |
| `parcels/<int:pk>/edit/` | `parcel_edit` | Officer only |
| `parcels/<int:pk>/delete/` | `parcel_delete` | Admin only; POST confirm |
| `parcels/state/<str:code>/` | `parcels_by_state` | **Regex URL** (see below) |
| `cases/` | `case_list` | List with status filter |
| `cases/add/` | `case_create` | Officer only |
| `cases/<int:pk>/` | `case_detail` | Shows timeline of `CaseUpdate` |
| `cases/<int:pk>/update/` | `case_update_status` | Officer only; creates a `CaseUpdate` row |
| `about/` | `about` | Simple static page (shows basic request/response) |

**Regex in URLs (syllabus requirement):** use `re_path` for at least one route, e.g.
```python
re_path(r'^parcels/state/(?P<code>[A-Z]{2})/$', views.parcels_by_state, name='parcels_by_state')
```
Also add `re_path(r'^cases/year/(?P<year>[0-9]{4})/$', views.cases_by_year, name='cases_by_year')`, which lists cases opened in that year.

### View logic notes
- Every view should show how it reads `request.method`, `request.GET` or `request.POST`, and returns `render()`, `redirect()` or `JsonResponse` or `HttpResponse`.
- Use `get_object_or_404()` for detail pages.
- Use `@login_required` on all land views.
- Use a small helper `is_officer(user)` (checks group `Officer` or superuser) and `@user_passes_test(is_officer)` for write views. If the check fails, raise `PermissionDenied` (this triggers the custom 403 page).
- Add one tiny view that returns a plain `HttpResponse("...")` and one that returns `JsonResponse` (the stats API) to show different response types.

### Error Handling
- Custom `404.html`, `403.html`, `500.html` templates (extend `base.html`, friendly message and a "Go to Dashboard" button).
- Handlers in `land/views.py`.
- Note in README that custom error pages only show with `DEBUG = False` (add `ALLOWED_HOSTS = ['*']` for the demo toggle).

---

## 5. Templates (DTL)

All templates extend `templates/base.html`.

### `base.html`
- Bootstrap 5 CDN, navbar with links (Dashboard, Parcels, Cases, About).
- Navbar shows `{% if user.is_authenticated %}` Hello `{{ user.username }}` and a Logout form button `{% else %}` Login / Signup `{% endif %}`.
- Flash messages block using `{% for message in messages %}`.
- `{% block title %}`, `{% block content %}`, `{% block scripts %}`.
- Footer.

### Templates list
```
templates/
├── base.html
├── 403.html  404.html  500.html
├── accounts/ login.html  signup.html  profile.html
└── land/
    ├── dashboard.html
    ├── parcel_list.html   parcel_detail.html   parcel_form.html   parcel_confirm_delete.html
    ├── case_list.html     case_detail.html     case_form.html      case_status_form.html
    ├── about.html
    └── _status_badge.html   (small include for coloured status badges)
```

### DTL features to show
- `{% extends %}`, `{% block %}`, `{% include %}`, `{% url 'land:parcel_detail' p.pk %}`, `{% static %}`, `{% csrf_token %}`
- `{% for %}` with `{% empty %}`, `{% if / elif / else %}`
- Variables such as `{{ parcel.title }}`
- Filters: `date`, `floatformat`, `truncatechars`, `default`, `intcomma` (optional, from `humanize`)
- A custom template tag/filter is **optional**. If you add one, make it a single `status_color` filter in `land/templatetags/land_extras.py`.

### Dashboard (the "decision support" feature)
Show 4 stat cards:
1. Total parcels
2. Total area (acres)
3. Active cases (not Completed or Rejected)
4. Total compensation paid (₹)

Below them:
- A table: **cases by status** (count per status, using ORM `values().annotate(Count())`).
- A table: **top 5 states by acquired area**.
- A list: **latest 5 case updates** (live activity feed).
- Optional: one Chart.js bar chart from CDN for cases by status (skip if time is short).

**Real-time JS** (in `{% block scripts %}`):
```js
async function refresh() {
  const res = await fetch("{% url 'land:stats_api' %}");
  const data = await res.json();
  // update the numbers inside elements with ids: total-parcels, total-area, active-cases, total-comp
}
setInterval(refresh, 10000);
```
Show a small "Last updated: HH:MM:SS" label that changes after each poll.

---

## 6. Forms

### `land/forms.py`
- `ParcelForm(ModelForm)`: fields for parcel creation and edit.
  - `clean_area_acres`: must be > 0.
  - `clean_market_value`: must be > 0.
  - `clean_parcel_id`: uppercase it and check the format with a simple regex such as `^[A-Z]{2}-[A-Z]{3}-\d{4}$`.
- `CaseForm(ModelForm)`: parcel, project name, purpose.
  - `clean()`: block creating a new case for a parcel that already has an **active** case.
- `CaseStatusForm(forms.Form)`: `new_status` (ChoiceField), `compensation_amount` (optional), `remarks` (required).
  - `clean()`: enforce the allowed status transitions from Section 3; require `compensation_amount` when moving to `APPROVED`.
- `ParcelSearchForm(forms.Form)` (**GET form**): `q`, `state`, `land_type`, all optional.

### `accounts/forms.py`
- `SignupForm(UserCreationForm)` with an added `email` field (required, unique check in `clean_email`) and Bootstrap classes on widgets.
- Login uses a plain `AuthenticationForm`.

### Form rules
- Every POST form includes `{% csrf_token %}`.
- Follow **POST → Redirect → GET**: after a successful POST, call `redirect()` and then show `messages.success(...)`.
- Show field errors under each field in the template (`{{ form.field.errors }}`).
- The search form demonstrates **GET**; create and edit forms demonstrate **POST**.
- Add a short comment in the code and the README explaining what CSRF is and how `{% csrf_token %}` + middleware protect POST requests. Add a tiny demo page, or a commented example, showing that removing the token gives **403 Forbidden**.

---

## 7. Authentication, Cookies and Sessions

### Auth
- **Signup:** create user, add them to the `Viewer` group (create the group if missing), log them in, redirect to the dashboard.
- **Login:** use `authenticate()` and `login()`. Support `?next=` redirect. Show an error message on wrong credentials.
- **Logout:** POST-only view calling `logout()`, then redirect to login with a message.
- `@login_required` protects everything except login, signup and about.

### Sessions
- Track **recently viewed parcels** in `request.session['recent_parcels']` (store the last 5 parcel IDs, no duplicates). Show them on the profile page and as a sidebar widget on the parcel list.
- Track **visit count** in `request.session['visits']`, incremented on each dashboard visit. Show it on the profile page.

### Cookies
- On `parcel_list`, when the user picks a state filter, save it with `response.set_cookie('last_state', code, max_age=7*24*3600)`.
- On the next visit with no filter in the URL, read `request.COOKIES.get('last_state')` and pre-select it. Add a "Clear saved filter" link that calls `response.delete_cookie('last_state')`.

---

## 8. Django Admin, Users and Permissions

In `land/admin.py` register all 4 models with simple `ModelAdmin` classes:
- `LandParcelAdmin`: `list_display` (parcel_id, title, state, area_acres, land_type), `list_filter` (state, land_type), `search_fields`.
- `AcquisitionCaseAdmin`: `list_display`, `list_filter` (status, purpose), `search_fields`.
- `CaseUpdateAdmin`: read-only style, `list_display`.
- `StateAdmin`.

**Groups and permissions (setup via a management command or the README steps):**
- `Officer` group gets `add`, `change` and `view` permissions on parcel, case and caseupdate.
- `Viewer` group gets `view` only.
- Demonstrate in the presentation: create a user in Admin, assign them to a group and show how access changes.

### Demo data (small)
Create a management command `land/management/commands/seed_demo.py` that creates:
- Groups `Officer` and `Viewer` with permissions
- Users: `admin / admin123` (superuser), `officer1 / officer123` (Officer), `viewer1 / viewer123` (Viewer)
- 6 states, about 15 parcels and about 8 cases in various statuses, with a few `CaseUpdate` rows

Run with `python manage.py seed_demo`.

---

## 9. Build Phases

**Phase 1: Setup and models**
Create the project and apps, write the models, run migrations, register in admin, create the superuser, and build `seed_demo`.

**Phase 2: Templates, base layout and auth**
Write `base.html`, `style.css`, and the signup, login and logout flow with a Bootstrap look and flash messages.

**Phase 3: Parcel module**
List with GET search, detail with URL param, create, edit and delete, the `ParcelForm` with validation, session "recently viewed" and the cookie filter.

**Phase 4: Case module**
Case list, create, detail with timeline, and the status update form with transition validation and `CaseUpdate` logging.

**Phase 5: Dashboard and real-time**
Dashboard stats using the ORM, `stats_api` JSON endpoint, and polling JavaScript.

**Phase 6: Permissions and errors**
Group-based role checks, custom 403, 404 and 500 pages, and the regex URLs.

**Phase 7: Tests and polish**
Write `tests.py` (see below), check the UI on mobile width, write README, and take a final run-through.

### Tests (`land/tests.py` and `accounts/tests.py`), keep to about 8 to 10 simple tests
- Model: `LandParcel.__str__` and the case default status.
- View: dashboard redirects to login if anonymous.
- View: parcel list returns 200 for a logged-in user.
- View: Viewer gets 403 on `parcels/add/`; Officer gets 200.
- Form: `ParcelForm` rejects a negative area.
- Form: `CaseStatusForm` rejects an invalid transition (e.g. `COMPLETED → PROPOSED`).
- Auth: signup creates a user and puts them in the `Viewer` group.
- API: `stats_api` returns JSON with the expected keys.
- URL: regex URL `parcels/state/PB/` resolves.

Run with `python manage.py test`.

### Debugging
- Console logging configured in `settings.py` (a `logger.info()` call when a case status changes).
- In the README, show how to use `python manage.py shell`, the Django debug error page (`DEBUG=True`), and `print`/`pdb` as simple debugging tools.

---

## 10. Syllabus Coverage Checklist

| Unit | Topic | Where it is demonstrated |
|---|---|---|
| **Unit II: Views and URLs** | Creating views and mapping to URLs | `land/urls.py`, `accounts/urls.py` |
| | HTTP requests, requests and responses | `request.GET/POST/method`, `render`, `redirect`, `HttpResponse`, `JsonResponse` |
| | URLs with params | `parcels/<int:pk>/`, `cases/<int:pk>/` |
| | Regular expressions in URLs | `re_path` for state code and year |
| | Error handling | Custom 403/404/500 pages, `get_object_or_404`, `PermissionDenied` |
| **Unit III: Templates, Debugging, Testing** | Creating templates, DTL, tags, variables | All templates |
| | for loop and if-else | Lists, `{% empty %}`, navbar auth check |
| | Dynamic templates, template inheritance | `base.html` + `{% extends %}` and `{% include %}` |
| | Debugging | Logging config, debug page, shell |
| | Testing | `tests.py` |
| **Unit IV: Forms** | GET, POST | Search form (GET), create and edit forms (POST) |
| | Building forms in Django | `ModelForm`, `Form`, `UserCreationForm` |
| | CSRF and CSRF support in Django | `{% csrf_token %}` and middleware |
| | POST redirect | Redirect after every successful POST |
| | Data validation | `clean_<field>()` and `clean()` |
| **Unit V: Models, Migrations, Admin** | Creating models, migrations | 4 models, `makemigrations` and `migrate` |
| | Django shell, ORM (insert, update, delete) | Shell examples in README, ORM in dashboard queries |
| | Foreign keys | Parcel→State, Case→Parcel, Update→Case, and more |
| | Django Admin, groups, users, permissions | `admin.py`, groups `Officer` and `Viewer` |
| | Database configuration | SQLite in `settings.py` |
| **Unit VI: Cookies, Sessions, Auth** | Cookies | `last_state` filter cookie |
| | Sessions | Recently viewed parcels and visit count |
| | Creating and managing users | Signup and Admin user management |
| | Login and logout URLs, login in views | `login_view`, `logout_view`, `@login_required`, `LOGIN_URL` |

---

## 11. README.md Contents

1. Project title and a short description
2. Features list
3. Setup steps:
   ```
   python -m venv venv
   venv\Scripts\activate        # Windows
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py seed_demo
   python manage.py runserver
   ```
4. Demo logins (admin, officer1, viewer1)
5. Project structure
6. Syllabus coverage table (copy from Section 10)
7. Django shell examples: insert, update and delete a parcel with the ORM
8. How to run tests

---

## 12. Out of Scope (do NOT build)

- REST APIs / DRF, WebSockets, Celery or background jobs
- Real maps / GIS, PDF generation, email sending, payment gateway
- Class-based views, custom user model, Docker or deployment config
- Anything not listed above

When finished, confirm that `python manage.py check`, `python manage.py migrate`, `python manage.py test` and `python manage.py runserver` all work without errors.
