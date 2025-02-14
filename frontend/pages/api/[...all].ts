import type { NextApiRequest, NextApiResponse } from 'next'
import httpProxyMiddleware from 'next-http-proxy-middleware'

const dev = process.env.NODE_ENV !== 'production'

export const config = {
  api: {
    externalResolver: true,
  },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (dev) {
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
