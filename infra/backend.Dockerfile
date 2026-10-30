# Laravel on FrankenPHP. Build context: ../backend
FROM dunglas/frankenphp:1-php8.4-alpine

RUN install-php-extensions pdo_pgsql redis intl zip pcntl opcache \
    && apk add --no-cache fping iputils-arping

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

ENV SERVER_NAME=:8000
EXPOSE 8000

# Default command (frankenphp run) serves /app/public. Workers override the command in docker-compose.yml.
