import http from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApiMiddleware } from './monday.mjs'

const DIST = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist')
const PORT = Number(process.env.PORT || 3000)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

const api = createApiMiddleware(process.env)

const serveFile = (res, filePath, cacheable) => {
  res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream')
  res.setHeader('Cache-Control', cacheable ? 'public, max-age=31536000, immutable' : 'no-cache')
  createReadStream(filePath).pipe(res)
}

/**
 * Asset requests must 404 for real. Falling through to index.html with a 200
 * turns a missing product image into an invisible failure — nothing in the
 * browser or in monitoring can tell it apart from a working page.
 */
const isAssetRequest = (p) => extname(p) !== '' && !p.endsWith('.html')

/**
 * A malformed percent-escape in the URL ("/%E0%A4%A" from a scanner bot) makes
 * decodeURIComponent throw. Uncaught, that took the whole process down and the
 * reverse proxy answered every request with 502 until the container restarted.
 */
const decodePath = (url) => {
  try {
    return decodeURIComponent((url ?? '/').split('?')[0])
  } catch {
    return null
  }
}

const plain = (res, status, text) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end(text)
}

const serveStatic = (req, res) => {
  const urlPath = decodePath(req.url)
  if (urlPath === null) {
    plain(res, 400, 'Bad Request')
    return
  }
  const safePath = normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
  const filePath = join(DIST, safePath)
  if (filePath.startsWith(DIST) && existsSync(filePath) && statSync(filePath).isFile()) {
    serveFile(res, filePath, safePath.startsWith('/assets/'))
  } else if (isAssetRequest(safePath)) {
    console.error(`[static] 404 ${safePath}`)
    plain(res, 404, 'Not Found')
  } else {
    // SPA deep links fall back to the app shell
    serveFile(res, join(DIST, 'index.html'), false)
  }
}

http
  .createServer((req, res) => {
    Promise.resolve()
      .then(() => api(req, res, () => serveStatic(req, res)))
      .catch((err) => {
        console.error(`[server] ${req.method} ${req.url} failed:`, err)
        if (!res.headersSent) plain(res, 500, 'Internal Server Error')
        else res.end()
      })
  })
  .listen(PORT, () => console.log(`clima-form serving on :${PORT}`))

// never let one bad request take the process (and with it every other request) down
process.on('uncaughtException', (err) => console.error('[server] uncaught exception:', err))
process.on('unhandledRejection', (err) => console.error('[server] unhandled rejection:', err))
