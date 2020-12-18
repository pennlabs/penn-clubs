/**
 * This file is necessary in order to perform CSS imports.
 */
import 'react-toastify/dist/ReactToastify.min.css'

import { AppProps } from 'next/app'
import { ReactElement } from 'react'

const App = ({ Component, pageProps }: AppProps): ReactElement => {
  return <Component {...pageProps} />
}

export default App
