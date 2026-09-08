<?php
// One-time helper: generates a strong random ADMIN_API_KEY and prints the
// exact values to paste into config.php (server) and .env.production (build).
// Run: php generate-admin-key.php   (locally, or upload + open in browser once)
// DELETE this file after use.

header('Content-Type: text/plain; charset=utf-8');

$key = bin2hex(random_bytes(32)); // 64 hex characters

echo "Your new ADMIN_API_KEY:\n\n";
echo "  {$key}\n\n";
echo "1) In api/config.php on the server, set:\n\n";
echo "     define('ADMIN_API_KEY', '{$key}');\n\n";
echo "2) In your local .env.production (before `npm run build`), set:\n\n";
echo "     VITE_ADMIN_KEY={$key}\n\n";
echo "Keep this key private. Anyone with it can attempt admin logins.\n";
