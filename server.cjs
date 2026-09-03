const { spawn } = require('node:child_process')

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const port = process.env.PORT || '3000'
const server = spawn(command, ['json-server', '--host', '0.0.0.0', '--port', port, 'db.json'], {
  stdio: 'inherit',
})

server.on('exit', (code) => process.exit(code ?? 1))

process.on('SIGTERM', () => server.kill('SIGTERM'))
process.on('SIGINT', () => server.kill('SIGINT'))