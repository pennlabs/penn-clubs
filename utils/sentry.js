import React from 'react'
let Sentry

const { SENTRY_URL } = process.env

if (!SENTRY_URL) {
  console.log('Missing SENTRY_URL in process environment.') // eslint-disable-line no-console
}

if (process.browser) {
  // If the code is running in user's browser
  Sentry = require('@sentry/browser')
} else {
  // If code is running on the server
  Sentry = require('@sentry/node')
}

Sentry.init({ dsn: SENTRY_URL })

export function logException(ex, context) {
  Sentry.captureException(ex, {
    extra: context,
  })
  window.console && console.error && console.error(ex) // eslint-disable-line no-console
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
