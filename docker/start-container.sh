#!/bin/sh

set -eu

cd /var/www/html

if [ -z "${APP_KEY:-}" ]; then
    echo "APP_KEY is not set. Copy .env.docker.example to .env and add a stable APP_KEY before starting the stack." >&2
    exit 1
fi

mkdir -p \
    bootstrap/cache \
    storage/app/public \
    storage/debugbar \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/testing \
    storage/framework/views \
    storage/logs

chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache

if [ "${DB_CONNECTION:-mysql}" = "mysql" ]; then
    echo "Waiting for MySQL at ${DB_HOST:-db}:${DB_PORT:-3306}..."

    php <<'PHP'
<?php
$host = getenv('DB_HOST') ?: 'db';
$port = (int) (getenv('DB_PORT') ?: 3306);
$database = getenv('DB_DATABASE') ?: 'ideabox';
$username = getenv('DB_USERNAME') ?: 'root';
$password = getenv('DB_PASSWORD') ?: '';
$attempts = 30;

for ($attempt = 1; $attempt <= $attempts; $attempt++) {
    try {
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s', $host, $port, $database);
        new PDO($dsn, $username, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        exit(0);
    } catch (Throwable $exception) {
        fwrite(STDERR, sprintf("MySQL not ready (%d/%d): %s\n", $attempt, $attempts, $exception->getMessage()));
        sleep(2);
    }
}

fwrite(STDERR, "MySQL did not become ready in time.\n");
exit(1);
PHP
fi

php artisan migrate --force

if [ ! -e public/storage ]; then
    php artisan storage:link
fi

php artisan config:clear >/dev/null 2>&1 || true
php artisan view:clear >/dev/null 2>&1 || true
php artisan config:cache
php artisan view:cache

exec apache2-foreground
