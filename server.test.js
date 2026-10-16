import { describe, it, expect } from 'vitest'
import net from 'node:net'
import { resolvePort } from './server.cjs'

describe('resolvePort', () => {
  it('chooses the next free port when the requested port is occupied', async () => {
    const occupiedPort = 4001
    const server = net.createServer()

    await new Promise((resolve) => server.listen(occupiedPort, '127.0.0.1', resolve))

    try {
      const nextPort = await resolvePort(occupiedPort, 3)
      expect(nextPort).toBe(occupiedPort + 1)
    } finally {
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
    }
  })
})
