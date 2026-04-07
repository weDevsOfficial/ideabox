FROM php:8.3-cli AS php-deps

WORKDIR /app

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

RUN apt-get update \
    && apt-get install -y --no-install-recommends git libonig-dev libxml2-dev unzip \
    && docker-php-ext-install bcmath mbstring pdo_mysql xml \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction

FROM node:20-alpine AS frontend-build

WORKDIR /app

COPY . .
COPY --from=php-deps /app/vendor ./vendor

RUN corepack enable
RUN yarn install --frozen-lockfile
RUN yarn build

FROM php:8.3-apache AS runtime

WORKDIR /var/www/html

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl libonig-dev libxml2-dev \
    && docker-php-ext-install bcmath mbstring pdo_mysql opcache xml \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY . .
COPY --from=php-deps /app/vendor ./vendor
COPY --from=frontend-build /app/public/build ./public/build
COPY --from=frontend-build /app/bootstrap/ssr ./bootstrap/ssr
COPY docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf

RUN chmod +x /var/www/html/docker/start-container.sh \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

CMD ["/var/www/html/docker/start-container.sh"]
