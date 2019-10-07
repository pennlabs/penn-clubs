import React from 'react'
import Raven from 'raven-js'

Raven.config(
  'https://d24382d743314dadadb80d1eabdb139e@sentry.pennlabs.org/13'
).install()

export function logException(ex, context) {
  Raven.captureException(ex, {
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
