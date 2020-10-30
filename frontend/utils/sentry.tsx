import React from 'react'
let Sentry

const SENTRY_URL =
  'https://d24382d743314dadadb80d1eabdb139e@sentry.pennlabs.org/13'
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

export default function withSentry(WrappedComponent) {
  return class SentryComponent extends React.Component {
    render() {
      try {
        return <WrappedComponent {...this.props} />
      } catch (ex) {
        logException(ex)
      }
    }
  }
}
