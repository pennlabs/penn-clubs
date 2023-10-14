/**
 * This file is necessary in order to perform CSS imports.
 */
import 'react-toastify/dist/ReactToastify.min.css'

import { AppProps } from 'next/app'
import { ReactElement } from 'react'

import { Announcement } from '~/components/Announcement'
import RouteProgressBar from '~/components/RouteProgressBar'

const App = ({ Component, pageProps }: AppProps): ReactElement => {
  return (
    <>
      <Component {...pageProps} />
      <RouteProgressBar />
      <div
        style={{
          zIndex: 10000,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: 20,
        }}
      >
        <Announcement type="issue" title="Weekend Maintenance Alert" />
      </div>
    </>
  )
}

export default App
