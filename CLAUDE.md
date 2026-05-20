# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IdeaBox is an open-source customer feedback and roadmap management tool built with Laravel 10, Inertia.js, React 18, and Tailwind CSS.

## Common Commands

```bash
# Development
yarn dev                    # Start Vite dev server with hot reload
php artisan serve          # Start Laravel server at localhost:8000

# Build
yarn build                 # TypeScript check + Vite build + SSR build

# Testing
./vendor/bin/pest          # Run all tests
./vendor/bin/pest tests/Feature/ExampleTest.php  # Run single test file

# Code Formatting
./vendor/bin/pint          # Format PHP code (Laravel Pint)

# Database
php artisan migrate        # Run migrations
php artisan db:seed        # Seed database (creates admin@example.com / password)
```

## Architecture

### Tech Stack
- **Backend**: Laravel 10 with Eloquent ORM
- **Frontend**: React 18 + TypeScript via Inertia.js (SSR enabled)
- **Styling**: Tailwind CSS with TailReact component library (@wedevs/tail-react)
- **Testing**: PestPHP

### Directory Structure
- `app/Http/Controllers/Admin/` - Admin panel controllers
- `app/Http/Controllers/Frontend/` - Public-facing controllers
- `app/Services/` - Business logic (OpenAIService, SettingService, integrations)
- `app/Jobs/` - Background jobs for notifications
- `resources/js/Pages/` - Inertia React page components
- `resources/js/Components/` - Reusable React components
- `resources/js/Layouts/` - Layout components (GuestLayout, FrontendLayout, AuthenticatedLayout)

### Core Models
- **Board** - Feedback categories/boards
- **Post** - Feedback items with votes, comments, status, ETA/impact/effort
- **Status** - Customizable status options for posts
- **IntegrationProvider/IntegrationRepository** - External service connections (GitHub)

### Integration System
New integrations extend `BaseIntegration` implementing `IntegrationInterface`, registered in `IntegrationServiceProvider`. See `docs/integrations.md` for details.

## Code Conventions

### PHP/Laravel
- Use `declare(strict_types=1);` in all PHP files
- Use Form Request classes for validation with array notation: `'email' => ['required', 'email']`
- Prefer service classes for business logic over fat controllers
- Use `Model::query()` instead of direct static methods
- Always eager load relations to avoid N+1 queries
- Define routes manually (no `Route::resource()`), always name routes
- Use tuple notation: `Route::get('about', [AboutController::class, 'index'])`

### React/TypeScript
- **Always use TailReact components** when available (Button, Modal, TextField, SelectInput, Table, Notice, Badge, etc.)
- Import from `@wedevs/tail-react` or `tail-react`
- Path alias: `@/*` maps to `resources/js/*`
- Inertia pages receive data as props from Laravel controllers

### Key TailReact Components
- `Button` - variant: primary/secondary/danger, style: fill/outline/link
- `Modal, ModalHeader, ModalBody, ModalActions` - Dialog components
- `ConfirmModal` - Simple yes/no confirmation
- `TextField`, `Textarea`, `SelectInput` - Form inputs
- `Table, TableHeader, TableBody` - Data tables
- `Notice` - Alerts (type: success/warning/error/info)
- `Badge` - Status indicators
