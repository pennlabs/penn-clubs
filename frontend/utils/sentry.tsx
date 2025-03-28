import getConfig from 'next/config'
import React from 'react'
let Sentry

const { publicRuntimeConfig } = getConfig()
const SENTRY_URL = publicRuntimeConfig.SENTRY_URL
const dev = process.env.NODE_ENV !== 'production'

if (process.browser) {
  // If the code is running in user's browser
  Sentry = require('@sentry/browser')
} else {
  // If code is running on the server
  Sentry = require('@sentry/node')
}

if (!dev) {
  Sentry.init({ dsn: SENTRY_URL })
}

export function logException(ex: Error, context?: any): void {
  Sentry.captureException(ex, {
    extra: context,
  })
  typeof window !== 'undefined' &&
    window.console &&
    console.error && // eslint-disable-line no-console
    console.error(ex) // eslint-disable-line no-console
}

export function logMessage(msg: string): void {
  Sentry.captureMessage(msg)
}

export default function withSentry<T>(
  WrappedComponent: React.ComponentType<T>,
): React.ComponentType<T> {
  return class SentryComponent extends React.Component<T> {
    render() {
      try {
        return <WrappedComponent {...(this.props as any)} />
      } catch (ex) {
        logException(ex)
      }
    }
  }
}
