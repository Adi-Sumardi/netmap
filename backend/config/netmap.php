<?php

declare(strict_types=1);

return [

    /*
     * Where the Next.js frontend lives. In production it is the same origin as
     * the API (Caddy), in development it is the Next dev server.
     */
    'frontend_url' => rtrim((string) env('NETMAP_FRONTEND_URL', env('APP_URL', 'http://localhost')), '/'),

    'initial_admin_email' => env('NETMAP_INITIAL_ADMIN_EMAIL'),

    /*
     * Optional Google Workspace domains. Empty = any Google account, but it
     * still has to be on the allowlist (users table).
     */
    'google_allowed_domains' => array_values(array_filter(array_map(
        fn (string $domain) => strtolower(trim($domain)),
        explode(',', (string) env('GOOGLE_ALLOWED_DOMAINS', '')),
    ))),

    'emergency_login_ttl_minutes' => 10,

    'mikrotik_write_enabled' => (bool) env('MIKROTIK_WRITE_ENABLED', false),

];
