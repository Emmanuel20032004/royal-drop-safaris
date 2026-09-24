# Node.js deployment

This project is deployed as a Hostinger Node.js application. The active backend
is `server.cjs`; it serves the React build and the JSON API from the same process.

## Hostinger settings

1. Set the application root to the project directory.
2. Set the startup file to `server.cjs` or the startup command to `npm start`.
3. Upload the project files, including `dist/` and `db.json`.
4. Restart the Node.js application after each deployment.

The frontend production build uses:

```text
VITE_API_BASE=https://your-domain.co.ke/api
```

## API checks

After deployment, these URLs should return JSON rather than the React HTML page:

```text
https://your-domain.co.ke/api/products
https://your-domain.co.ke/api/users?email=emmanuel.wema%40royaldropsafaris.test
```

Admin login is:

```text
POST https://your-domain.co.ke/api/auth/login
Content-Type: application/json

{"email":"emmanuel.wema@royaldropsafaris.test","password":"safaris@2026"}
```

The API persists changes to `db.json`. Keep regular backups of that file. Do not
use the old PHP files or configure the site as a PHP application while it is
running as Node.js.
