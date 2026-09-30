<?php

$origins = array_filter(array_map('trim', explode(',', env('FRONTEND_URLS', env('FRONTEND_URL', 'https://edulink-new.vercel.app')))));

$origins = array_merge($origins, [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://edulink-new.vercel.app',
]);

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_unique($origins)),
    'allowed_origins_patterns' => [
        '#^https://edulink.*\.vercel\.app$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['Content-Disposition'],
    'max_age' => 0,
    'supports_credentials' => true,
];
