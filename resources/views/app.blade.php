@php
    use App\Facades\Settings;
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <title inertia>{{ Settings::get('meta_title', config('app.name', 'Laravel')) }}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="robots" content="index, follow">
        <link rel="canonical" href="{{ url()->current() }}" />

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @if (auth()->user() && auth()->user()->isAdmin())
            @routes
        @else
            @routes(['frontend', 'auth'])
        @endif
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans dark:bg-gray-900 antialiased">
        @inertia
    </body>
</html>
