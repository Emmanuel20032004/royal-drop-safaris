# Deploying the PHP + MySQL API to Hostinger

The `api/` folder replaces json-server in production. It lives in a subfolder of your
existing Hostinger website (`yourdomain.co.ke/api`), so it does **not** count as an
additional hosted website. Data is stored in MySQL, so bookings, users, and packages
persist permanently.

## 1. Create the MySQL database (hPanel)

1. Log in to hPanel → **Databases → MySQL Databases**.
2. Create a new database (e.g. `royaldrop`) with a strong password.
3. Note the database name, username, and password (host is almost always `localhost`).

## 2. Upload the API

1. In hPanel → **Files → File Manager**, open `public_html`.
2. Create a folder named `api` inside it.
3. Upload these files into `public_html/api/`:
   - `index.php`
   - `config.php`
   - `install.php`
   - `.htaccess` (enable "show hidden files" in File Manager to see it)
4. Edit `public_html/api/config.php` and fill in the database credentials from step 1.

## 3. Initialize the database

1. Visit `https://yourdomain.co.ke/api/install.php` in your browser.
   It creates the tables and seeds them with your current products, users, and orders
   (user passwords are stored hashed — the login passwords themselves are unchanged).
2. **Delete `install.php` from the server immediately after it succeeds.**
3. Sanity check: open `https://yourdomain.co.ke/api/products` — you should see JSON.

## 4. Rebuild the frontend against the hosted API

Locally, in the project folder:

```powershell
copy .env.example .env.production
# edit .env.production: VITE_API_BASE=https://yourdomain.co.ke/api
npm run build
```

Upload the contents of `dist/` into `public_html/` (alongside the `api/` folder).

### Optional: shared admin key (recommended)

This adds a second secret on top of the per-user token, so only someone holding
the key can even attempt an admin login.

1. Run the generator (locally, or upload `generate-admin-key.php` and open it once):

   ```powershell
   php api/generate-admin-key.php
   ```

2. Copy the printed key into **both** places:
   - `api/config.php` on the server → `define('ADMIN_API_KEY', '...');`
   - local `.env.production` → `VITE_ADMIN_KEY=...`
3. Re-run `npm run build` and re-upload `dist/`.
4. Delete `generate-admin-key.php` from the server.

If the two values do not match, admin login will fail with "Invalid admin key."

## 5. Local development (unchanged)

Keep using `npm run server` (json-server) + `npm run dev`. When `VITE_API_BASE` is
unset the app talks to `http://localhost:3000`, and the login code automatically
falls back to the json-server flow there.

## Notes

- The API mirrors json-server: `GET/POST/PATCH/DELETE` on `/products`, `/users`,
  `/orders`, plus `GET /users?email=...`.
- **Access control:**
  - Public (no token): `GET /products`, `GET /orders`, `POST /users` (registration),
    `POST /orders` (booking submission), and `POST /auth/login`.
  - Admin-only: every other read/write (list users, add/edit/delete packages,
    confirm/delete bookings, verify/delete users) requires a valid
    `X-Admin-Token` header. The token is issued at `/auth/login`, stored in the
    admin's browser session, and sent automatically by the admin panel.
- Passwords and admin tokens are never returned by the API; passwords are stored
  hashed with `password_hash()`.
- **Optional extra layer:** if you set `ADMIN_API_KEY` in `config.php` and the
  matching `VITE_ADMIN_KEY` at build time, `/auth/login` itself requires that
  shared key — so random visitors cannot even attempt an admin login. Leave
  `ADMIN_API_KEY` empty to disable this.
- Follow-up hardening idea: restrict `/users` and admin mutations behind an admin
  token — right now anyone who knows the URL can read the user list.
