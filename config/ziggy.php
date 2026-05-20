<?php

return [
    'groups' => [
        'admin' => ['admin.*'],
        'frontend' => ['home', 'board.*', 'post.*', ],
        'auth' => ['login', 'register', 'password.*', 'password.request', 'password.reset', 'password.update', 'password.confirm', 'logout', 'verify-email', 'verification.notice', 'verification.verify', 'verification.send', 'auth.google', 'auth.google.callback'],
        'profile' => ['profile.*'],
    ],
];
