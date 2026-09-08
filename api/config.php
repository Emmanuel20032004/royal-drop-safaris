<?php
// Database credentials — copy these from hPanel → Databases → MySQL Databases.
// On Hostinger shared hosting the host is normally "localhost".
define('DB_HOST', 'localhost');
define('DB_NAME', 'u000000000_royaldrop');   // your MySQL database name
define('DB_USER', 'u000000000_royaldrop');   // your MySQL username
define('DB_PASS', 'CHANGE_ME');              // your MySQL password

// Optional shared secret. If set, /auth/login also requires this key in the
// "X-Admin-Key" header, so only people holding the key can even attempt login.
// Leave empty ('') to disable. Set the same value as VITE_ADMIN_KEY at build time.
define('ADMIN_API_KEY', '');
