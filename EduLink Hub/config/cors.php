<?php

$origins = array_filter(array_map('trim', explode(',', env('FRONTEND_URLS', env('FRONTEND_URL', 'http://localhost:3000')))));

// Preserve the existing frontend origin while enabling this repo's Next.js dev server.
// Production uses only the explicitly configured origins.
if (in_array(env('APP_ENV'), ['local', 'testing'], true)) {
    $origins = array_merge($origins, ['http://localhost:3000', 'http://127.0.0.1:3000']);
}

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_unique($origins)),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['Content-Disposition'],
    'max_age' => 0,
    'supports_credentials' => true,
];
