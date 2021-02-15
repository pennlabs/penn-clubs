/**
 * This file is necessary in order to perform CSS imports.
 */
import 'react-toastify/dist/ReactToastify.min.css'

import { AppProps } from 'next/app'
import { ReactElement } from 'react'

import RouteProgressBar from '~/components/RouteProgressBar'

const App = ({ Component, pageProps }: AppProps): ReactElement => {
  return (
    <>
      <Component {...pageProps} />
      <RouteProgressBar />
    </>
  )
}

export default App
