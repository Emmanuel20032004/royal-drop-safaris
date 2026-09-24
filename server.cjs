const http = require('node:http')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const port = Number(process.env.PORT || 3000)
const databasePath = path.join(__dirname, 'db.json')
const distPath = path.join(__dirname, 'dist')
const sessions = new Map()
const publicResources = new Set(['products', 'orders'])
const resources = new Set(['products', 'users', 'orders'])

function readDatabase() {
  return JSON.parse(fs.readFileSync(databasePath, 'utf8'))
}

function writeDatabase(database) {
  fs.writeFileSync(databasePath, `${JSON.stringify(database, null, 2)}\n`)
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  })
  response.end(JSON.stringify(payload))
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => { body += chunk })
    request.on('end', () => {
      if (!body) return resolve({})
      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error('Invalid JSON body.'))
      }
    })
    request.on('error', reject)
  })
}

function publicUser(user) {
  const result = { ...user }
  delete result.password
  delete result.apiToken
  return result
}

function findAdmin(request, database) {
  const token = request.headers['x-admin-token']
  const userId = token && sessions.get(token)
  return database.users.find((user) => user.id === userId && user.role === 'Admin') || null
}

function createToken(userId) {
  const token = crypto.randomBytes(24).toString('hex')
  sessions.set(token, userId)
  return token
}

function normalizePath(requestUrl) {
  const parsed = new URL(requestUrl, 'http://localhost')
  const segments = parsed.pathname.split('/').filter(Boolean)
  if (segments[0] === 'api') segments.shift()
  if (segments[0] === 'index.php') segments.shift()
  return { parsed, resource: segments[0] || '', id: segments[1] || null }
}

async function handleApi(request, response, route) {
  const { parsed, resource, id } = route
  const database = readDatabase()

  if (resource === 'auth' && id === 'login' && request.method === 'POST') {
    const body = await readBody(request)
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const user = database.users.find((candidate) => candidate.email.toLowerCase() === email)
    if (!user || user.password !== password) {
      return sendJson(response, 401, { error: 'The email or password is incorrect.' })
    }
    const result = publicUser(user)
    if (user.role === 'Admin') result.apiToken = createToken(user.id)
    return sendJson(response, 200, result)
  }

  if (!resources.has(resource)) return sendJson(response, 404, { error: 'Not found.' })

  const isEmailLookup = resource === 'users' && parsed.searchParams.has('email')
  const isPublic = (request.method === 'GET' && (publicResources.has(resource) || isEmailLookup)) ||
    (request.method === 'POST' && (resource === 'users' || resource === 'orders'))
  if (!isPublic && !findAdmin(request, database)) {
    return sendJson(response, 401, { error: 'Admin authentication required.' })
  }

  if (request.method === 'GET') {
    let rows = database[resource]
    if (isEmailLookup) {
      const email = parsed.searchParams.get('email').trim().toLowerCase()
      rows = rows.filter((user) => user.email.toLowerCase() === email)
    } else if (id) {
      const row = rows.find((item) => item.id === id)
      return row ? sendJson(response, 200, resource === 'users' ? publicUser(row) : row) : sendJson(response, 404, { error: 'Not found.' })
    }
    return sendJson(response, 200, resource === 'users' ? rows.map(publicUser) : rows)
  }

  if (request.method === 'POST' && !id) {
    const body = await readBody(request)
    const row = { ...body, id: body.id || crypto.randomBytes(8).toString('hex') }
    if (resource === 'users') row.email = String(row.email || '').trim().toLowerCase()
    database[resource].push(row)
    writeDatabase(database)
    return sendJson(response, 201, resource === 'users' ? publicUser(row) : row)
  }

  if ((request.method === 'PATCH' || request.method === 'DELETE') && id) {
    const index = database[resource].findIndex((item) => item.id === id)
    if (index === -1) return sendJson(response, 404, { error: 'Not found.' })
    if (request.method === 'DELETE') {
      database[resource].splice(index, 1)
      writeDatabase(database)
      return sendJson(response, 200, {})
    }
    const body = await readBody(request)
    database[resource][index] = { ...database[resource][index], ...body, id }
    writeDatabase(database)
    return sendJson(response, 200, resource === 'users' ? publicUser(database[resource][index]) : database[resource][index])
  }

  return sendJson(response, 405, { error: 'Method not allowed.' })
}

function serveStatic(request, response) {
  const requestedPath = new URL(request.url, 'http://localhost').pathname
  const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.slice(1)
  const filePath = path.resolve(distPath, relativePath)
  const safePath = filePath.startsWith(path.resolve(distPath)) ? filePath : path.join(distPath, 'index.html')
  const finalPath = fs.existsSync(safePath) && fs.statSync(safePath).isFile() ? safePath : path.join(distPath, 'index.html')
  const contentTypes = { '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' }
  response.writeHead(200, { 'Content-Type': contentTypes[path.extname(finalPath)] || 'text/html' })
  fs.createReadStream(finalPath).pipe(response)
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return sendJson(response, 204, {})
  try {
    const route = normalizePath(request.url)
    if (route.resource && (request.url.startsWith('/api') || resources.has(route.resource) || route.resource === 'auth')) {
      return await handleApi(request, response, route)
    }
    return serveStatic(request, response)
  } catch (error) {
    console.error(error)
    return sendJson(response, error.message === 'Invalid JSON body.' ? 400 : 500, { error: error.message })
  }
})

server.listen(port, '0.0.0.0', () => console.log(`Royal Drop server listening on port ${port}`))