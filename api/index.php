<?php
// Royal Drop Safaris API — drop-in json-server replacement for Hostinger (PHP + MySQL).
// Exposes GET/POST/PATCH/DELETE on /products, /users, /orders plus POST /auth/login.

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token, X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/config.php';

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    respond(500, ['error' => 'Database connection failed.']);
}

// --- Routing ---------------------------------------------------------------
$scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
$uriPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$path = '/' . ltrim(substr($uriPath, strlen($scriptDir)), '/');
$segments = array_values(array_filter(explode('/', $path), 'strlen'));
$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

$tables = ['products', 'users', 'orders'];

// Anyone may read the package catalog.
$publicGet = $method === 'GET' && in_array($resource, ['products', 'orders'], true);
// Registration and booking submission stay open so visitors can sign up and book.
$publicPost = $method === 'POST' && in_array($resource, ['users', 'orders'], true);
$isPublic = $publicGet || $publicPost;

if ($resource === 'auth' && $id === 'login' && $method === 'POST') {
    handleLogin($pdo);
}
if (!in_array($resource, $tables, true)) {
    respond(404, ['error' => 'Not found.']);
}

if (!$isPublic && !isAuthorizedAdmin($pdo)) {
    respond(401, ['error' => 'Admin authentication required.']);
}

$body = readJsonBody();

switch ($method) {
    case 'GET':
        $id === null ? listRows($pdo, $resource) : getRow($pdo, $resource, $id);
        break;
    case 'POST':
        $id === null ? createRow($pdo, $resource, $body) : respond(404, ['error' => 'Not found.']);
        break;
    case 'PATCH':
        $id !== null ? updateRow($pdo, $resource, $id, $body) : respond(404, ['error' => 'Not found.']);
        break;
    case 'DELETE':
        $id !== null ? deleteRow($pdo, $resource, $id) : respond(404, ['error' => 'Not found.']);
        break;
    default:
        respond(405, ['error' => 'Method not allowed.']);
}

// --- Handlers --------------------------------------------------------------

function listRows(PDO $pdo, string $table): void
{
    $isUser = $table === 'users';
    if ($isUser && isset($_GET['email'])) {
        $stmt = $pdo->prepare('SELECT data FROM users WHERE email = ?');
        $stmt->execute([strtolower(trim($_GET['email']))]);
    } else {
        $stmt = $pdo->query("SELECT data FROM `$table`");
    }
    $rows = array_map(
        fn($row) => decodeRow($row, $isUser),
        $stmt->fetchAll(PDO::FETCH_ASSOC)
    );
    respond(200, $rows);
}

function getRow(PDO $pdo, string $table, string $id): void
{
    $stmt = $pdo->prepare("SELECT data FROM `$table` WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        respond(404, ['error' => 'Not found.']);
    }
    respond(200, decodeRow($row, $table === 'users'));
}

function createRow(PDO $pdo, string $table, array $body): void
{
    $isUser = $table === 'users';
    $id = isset($body['id']) && $body['id'] !== '' ? (string) $body['id'] : generateId();
    $body['id'] = $id;

    if ($isUser) {
        if (isset($body['password'])) {
            $body['password'] = password_hash($body['password'], PASSWORD_DEFAULT);
        }
        if (isset($body['email'])) {
            $body['email'] = strtolower(trim($body['email']));
        }
        $stmt = $pdo->prepare('INSERT INTO users (id, email, data) VALUES (?, ?, ?)');
        $stmt->execute([$id, $body['email'] ?? '', json_encode($body, JSON_UNESCAPED_SLASHES)]);
        unset($body['password']);
    } else {
        $stmt = $pdo->prepare("INSERT INTO `$table` (id, data) VALUES (?, ?)");
        $stmt->execute([$id, json_encode($body, JSON_UNESCAPED_SLASHES)]);
    }
    respond(201, $body);
}

function updateRow(PDO $pdo, string $table, string $id, array $body): void
{
    $isUser = $table === 'users';
    $stmt = $pdo->prepare("SELECT data FROM `$table` WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        respond(404, ['error' => 'Not found.']);
    }

    $existing = json_decode($row['data'], true) ?: [];
    $merged = array_merge($existing, $body);
    $merged['id'] = $id; // the id in the URL always wins

    if ($isUser) {
        if (isset($body['password'])) {
            $merged['password'] = password_hash($body['password'], PASSWORD_DEFAULT);
        }
        if (isset($merged['email'])) {
            $merged['email'] = strtolower(trim($merged['email']));
        }
        $update = $pdo->prepare('UPDATE users SET email = ?, data = ? WHERE id = ?');
        $update->execute([$merged['email'] ?? '', json_encode($merged, JSON_UNESCAPED_SLASHES), $id]);
        unset($merged['password']);
    } else {
        $update = $pdo->prepare("UPDATE `$table` SET data = ? WHERE id = ?");
        $update->execute([json_encode($merged, JSON_UNESCAPED_SLASHES), $id]);
    }
    respond(200, $merged);
}

function deleteRow(PDO $pdo, string $table, string $id): void
{
    $stmt = $pdo->prepare("DELETE FROM `$table` WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        respond(404, ['error' => 'Not found.']);
    }
    respond(200, new stdClass()); // matches json-server's "{}" response
}

function handleLogin(PDO $pdo): void
{
    if (ADMIN_API_KEY !== '' && getAdminKeyHeader() !== ADMIN_API_KEY) {
        respond(401, ['error' => 'Invalid admin key.']);
    }

    $body = readJsonBody();
    $email = strtolower(trim($body['email'] ?? ''));
    $password = (string) ($body['password'] ?? '');

    $stmt = $pdo->prepare('SELECT data FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $user = $row ? json_decode($row['data'], true) : null;

    if (!$user || empty($user['password']) || !password_verify($password, $user['password'])) {
        respond(401, ['error' => 'The email or password is incorrect.']);
    }

    // Admins get a fresh API token on every login; customers do not need one.
    if (($user['role'] ?? '') === 'Admin') {
        $token = bin2hex(random_bytes(24));
        $user['apiToken'] = $token;
        $update = $pdo->prepare('UPDATE users SET data = ? WHERE id = ?');
        $update->execute([json_encode($user, JSON_UNESCAPED_SLASHES), $user['id']]);
    }

    unset($user['password']);
    respond(200, $user);
}

// --- Helpers ---------------------------------------------------------------

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        respond(400, ['error' => 'Invalid JSON body.']);
    }
    return $data;
}

function decodeRow(array $row, bool $isUser): array
{
    $data = json_decode($row['data'], true) ?: [];
    if ($isUser) {
        unset($data['password'], $data['apiToken']);
    }
    return $data;
}

function getAdminTokenHeader(): string
{
    return trim(
        $_SERVER['HTTP_X_ADMIN_TOKEN'] ??
        $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ??
        ''
    );
}

function getAdminKeyHeader(): string
{
    return trim($_SERVER['HTTP_X_ADMIN_KEY'] ?? '');
}

function isAuthorizedAdmin(PDO $pdo): bool
{
    $token = getAdminTokenHeader();
    if ($token === '' || strlen($token) > 64) {
        return false;
    }
    $stmt = $pdo->prepare("SELECT data FROM users WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.apiToken')) = ? LIMIT 1");
    $stmt->execute([$token]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return false;
    }
    $user = json_decode($row['data'], true) ?: [];
    return ($user['role'] ?? '') === 'Admin';
}

function generateId(int $length = 11): string
{
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    $id = '';
    for ($i = 0; $i < $length; $i++) {
        $id .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return $id;
}

function respond(int $status, $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
