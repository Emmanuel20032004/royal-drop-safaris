# Hostinger deployment: frontend + API subdomain

The intended production layout is:

- `https://royaldropsafaris.com` — React/Vite public frontend.
- `https://api.royaldropsafaris.com` — PHP API and MySQL backend.
- `https://admin.royaldropsafaris.com` — optional; the admin portal currently
  lives in the same React app and does not require a separate deployment.

The API is a separate PHP site, not a Vite route or a Node process attached to
the frontend. The frontend calls the API using the production `VITE_API_BASE`.

## 1. Configure the API subdomain in Hostinger

Create `api.royaldropsafaris.com` in hPanel and attach it to the PHP hosting
site/document root. Configure the DNS record Hostinger requests for that site
(typically an A record to the hosting IP or a CNAME provided by Hostinger).
Wait for DNS/SSL provisioning before testing HTTPS.

Keep the existing frontend site attached to `royaldropsafaris.com`. Do not
replace its Vite deployment when setting up the API subdomain.

## 2. Install the PHP API

1. Create a MySQL database in hPanel and enter its credentials in `config.php`.
2. In the document root attached to `api.royaldropsafaris.com`, upload
   `index.php`, `config.php`, and `.htaccess` from this folder. These files
   should be directly in that document root, not in another `api` directory.
3. Upload `install.php` temporarily to the same document root and visit
   `https://api.royaldropsafaris.com/install.php` once to create and seed the
   tables.
4. Delete `install.php` from the server immediately after it succeeds.
5. Confirm `https://api.royaldropsafaris.com/products` returns JSON.

Do not upload `generate-admin-key.php` to a public directory. If you enable
`ADMIN_API_KEY` in `config.php`, use the same value as `VITE_ADMIN_KEY` when
building the frontend.

## 3. Connect and redeploy the frontend

The production setting is:

```text
VITE_API_BASE=https://api.royaldropsafaris.com
```

It is set in `.env.production`. If Hostinger defines build environment
variables, set `VITE_API_BASE` there to the same value. Then build and redeploy
the React frontend at `royaldropsafaris.com`. Vite embeds this value at build
time, so changing it without rebuilding does not change an existing deployment.

The PHP API allows cross-origin requests so the frontend can call it from the
main domain. If the admin app is later hosted on its own origin, that origin
must also be permitted by the API's CORS configuration.

## 4. Verify

These API URLs should return JSON, not a Hostinger default page, a 404, or the
React app HTML:

```text
https://api.royaldropsafaris.com/products
https://api.royaldropsafaris.com/users?email=emmanuel.wema%40royaldropsafaris.test
```

Admin login endpoint:

```text
POST https://api.royaldropsafaris.com/auth/login
Content-Type: application/json

{"email":"your-admin-email","password":"your-admin-password"}
```

The PHP API stores data in MySQL. Keep regular database backups.

## Optional separate admin hostname

The current admin portal is part of the React app (for example
`https://royaldropsafaris.com/admin/login`). If you later want
`admin.royaldropsafaris.com`, point it to the same frontend deployment and
configure the hosting site's domain mapping and SPA fallback. No additional
backend is needed.

## Alternative: same-site Node deployment

If the frontend and `server.cjs` API are instead deployed together as one Node
application, use `VITE_API_BASE=https://your-domain.example/api`, upload
`dist/` and `db.json`, and restart the Node app after deployment. Do not use
this alternative alongside the separate PHP API unless you intentionally want
two backends.
