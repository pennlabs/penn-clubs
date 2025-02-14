import type { NextApiRequest, NextApiResponse } from 'next'
import httpProxyMiddleware from 'next-http-proxy-middleware'

const dev = process.env.NODE_ENV !== 'production'

export const config = {
  api: {
    externalResolver: false,
  },
}

// Ensures path has a trailing slash before query parameters for Django purposes
const ensureTrailingSlash = (path: string): string => {
  const [pathname, query] = path.split('?')
  if (pathname.endsWith('/')) {
    return path
  }
  return `${pathname}/${query ? `?${query}` : ''}`
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (dev) {
    req.url = ensureTrailingSlash(req.url || '')

    await httpProxyMiddleware(req, res, {
      ws: true,
      followRedirects: true,
      target: 'http://localhost:8000',
      pathRewrite: [
        {
          patternStr: '^/api',
          replaceStr: '/api',
        },
      ],
    })

    // Modify the URL for debug routes as well
    req.url = ensureTrailingSlash(req.url || '')

    await httpProxyMiddleware(req, res, {
      followRedirects: true,
      target: 'http://localhost:8000',
      pathRewrite: [
        {
          patternStr: '^/__debug__',
          replaceStr: '/__debug__',
        },
      ],
    })
  } else {
    res.status(404).send(null)
  }
}
