<?php
// One-time installer: creates tables and seeds them with the current db.json data.
// Run it once in your browser (https://your-domain/api/install.php), then DELETE this file.

require __DIR__ . '/config.php';
header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    exit("Database connection failed. Check the credentials in config.php.\n");
}

$pdo->exec('CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(32) PRIMARY KEY,
    data LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');

$pdo->exec('CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(32) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    data LONGTEXT NOT NULL,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');

$pdo->exec('CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(32) PRIMARY KEY,
    data LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');

echo "Tables created (or already existed).\n";

$existing = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
if ($existing > 0) {
    exit("Database already contains data — seeding skipped.\nIMPORTANT: delete install.php from the server now.\n");
}

// --- Seed data (mirrors db.json) --------------------------------------------

$products = [
    ['id' => 'p1', 'name' => 'Maasai Mara Big 5 Classic', 'type' => 'Safari', 'location' => 'Maasai Mara', 'duration' => '3 Days / 2 Nights', 'description' => 'Game drives, park fees, and full-board stay at a mid-luxury camp.', 'price' => 48000, 'image' => 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80'],
    ['id' => 'p2', 'name' => 'Amboseli Elephant Trail', 'type' => 'Safari', 'location' => 'Amboseli', 'duration' => '2 Days / 1 Night', 'description' => 'Guided game drives with Kilimanjaro views and lodge accommodation.', 'price' => 32500, 'image' => 'https://images.unsplash.com/photo-1581852017103-68ac65514cf7?auto=format&fit=crop&w=1200&q=80'],
    ['id' => 'p3', 'name' => 'Diani Beach Holiday Escape', 'type' => 'Hotel', 'location' => 'Diani', 'duration' => '4 Days / 3 Nights', 'description' => 'Beachfront resort stay with breakfast and airport transfers.', 'price' => 39500, 'image' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'],
    ['id' => 'p4', 'name' => 'Naivasha Family Retreat', 'type' => 'Hotel', 'location' => 'Naivasha', 'duration' => '3 Days / 2 Nights', 'description' => 'Family-friendly lodge package with boat ride and nature walk.', 'price' => 28500, 'image' => 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80'],
    ['id' => 'p5', 'name' => 'Samburu Luxury Safari', 'type' => 'Luxury', 'location' => 'Samburu', 'duration' => '4 Days / 3 Nights', 'description' => 'Premium tented camp, private guide, and sunset bush dinner.', 'price' => 86000, 'image' => 'https://images.unsplash.com/photo-1526711657229-e7e080ed7aa1?auto=format&fit=crop&w=1200&q=80'],
    ['id' => 'p6', 'name' => 'Mombasa + Tsavo Combo', 'type' => 'Combo', 'location' => 'Mombasa / Tsavo', 'duration' => '5 Days / 4 Nights', 'description' => 'Two-night beach stay plus two-night safari with transfers included.', 'price' => 72500, 'image' => 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80'],
    ['id' => 'p7', 'name' => 'Majlis Hotel Lamu', 'type' => 'Hotel', 'location' => 'Lamu Island', 'duration' => 'Year Round (Half Board)', 'description' => 'Majlis blends Swahili and Arab heritage with boutique luxury. Includes half board: bed, breakfast, and a la carte lunch or dinner.', 'price' => 55700, 'image' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', 'rateCard' => [
        ['roomType' => 'Superior Room', 'twinDouble' => '432 USD', 'single' => '295 USD', 'tripleAdults' => '645 USD', 'tripleWithChild' => '549 USD'],
        ['roomType' => 'Deluxe Room (max 3)', 'twinDouble' => '514 USD', 'single' => '308 USD', 'tripleAdults' => '768 USD', 'tripleWithChild' => '645 USD'],
        ['roomType' => 'Junior Suite (max 3)', 'single' => '714 USD'],
        ['roomType' => 'Royal Suite (max 4)', 'single' => '1414 USD'],
    ]],
];

$users = [
    ['id' => 'a1', 'name' => 'Emmanuel Wema', 'phone' => '+254700000001', 'email' => 'emmanuel.wema@royaldropsafaris.test', 'password' => 'safaris@2026', 'role' => 'Admin', 'verified' => true],
    ['id' => 'a2', 'name' => 'Maureen Mureithi', 'phone' => '+254700000002', 'email' => 'maureen.mureithi@royaldropsafaris.test', 'password' => 'safaris@2026', 'role' => 'Admin', 'verified' => true],
    ['id' => 'c1', 'name' => 'Sample Customer', 'phone' => '+254700000101', 'email' => 'customer@royaldropsafaris.test', 'password' => 'Customer2026!', 'role' => 'Customer', 'verified' => true],
    ['id' => 'ILqAKOiiZcY', 'name' => 'EMMANUEL WEMA', 'phone' => '0707177362', 'email' => 'emmanwema003@gmail.com', 'password' => 'Kirathi2004', 'role' => 'Customer', 'verified' => true],
];

$orders = [
    ['id' => 'c1ItQbmp9ag', 'packageId' => 'p2', 'packageName' => 'Amboseli Elephant Trail', 'packageType' => 'Safari', 'location' => 'Amboseli', 'price' => 32500, 'guests' => 1, 'checkInDate' => '2026-08-26', 'userId' => 'ILqAKOiiZcY', 'userEmail' => 'emmanwema003@gmail.com', 'status' => 'pending', 'createdAt' => '2026-08-24T08:35:54.905Z'],
    ['id' => 'JhNI0l9ja1U', 'packageId' => 'p4', 'packageName' => 'Naivasha Family Retreat', 'packageType' => 'Hotel', 'location' => 'Naivasha', 'price' => 28500, 'guests' => 1, 'checkInDate' => '2026-08-28', 'userId' => 'ILqAKOiiZcY', 'userEmail' => 'emmanwema003@gmail.com', 'status' => 'pending', 'createdAt' => '2026-08-24T08:42:32.186Z'],
];

$insertProduct = $pdo->prepare('INSERT INTO products (id, data) VALUES (?, ?)');
foreach ($products as $product) {
    $insertProduct->execute([$product['id'], json_encode($product, JSON_UNESCAPED_SLASHES)]);
}

// Passwords are hashed before storage — plaintext never touches the database.
$insertUser = $pdo->prepare('INSERT INTO users (id, email, data) VALUES (?, ?, ?)');
foreach ($users as $user) {
    $user['email'] = strtolower(trim($user['email']));
    $user['password'] = password_hash($user['password'], PASSWORD_DEFAULT);
    $insertUser->execute([$user['id'], $user['email'], json_encode($user, JSON_UNESCAPED_SLASHES)]);
}

$insertOrder = $pdo->prepare('INSERT INTO orders (id, data) VALUES (?, ?)');
foreach ($orders as $order) {
    $insertOrder->execute([$order['id'], json_encode($order, JSON_UNESCAPED_SLASHES)]);
}

echo "Seeded " . count($products) . " products, " . count($users) . " users, " . count($orders) . " orders.\n";
echo "Login passwords are unchanged (now stored hashed).\n";
echo "IMPORTANT: delete install.php from the server now.\n";
