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

http
  .createServer((req, res) => {
    api(req, res, () => {
      const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0])
      const safePath = normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
      const filePath = join(DIST, safePath)
      if (filePath.startsWith(DIST) && existsSync(filePath) && statSync(filePath).isFile()) {
        serveFile(res, filePath, safePath.startsWith('/assets/'))
      } else if (isAssetRequest(safePath)) {
        console.error(`[static] 404 ${safePath}`)
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end('Not Found')
      } else {
        // SPA deep links fall back to the app shell
        serveFile(res, join(DIST, 'index.html'), false)
      }
    })
  })
  .listen(PORT, () => console.log(`clima-form serving on :${PORT}`))
