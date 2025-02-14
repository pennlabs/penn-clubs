import 'react-toastify/dist/ReactToastify.css'

import Head from 'next/head'
import Script from 'next/script'
import { ReactElement, useEffect } from 'react'

import { initGA, logPageView } from '../../utils/analytics'
import { SITE_FAVICON } from '../../utils/branding'

declare global {
  interface Window {
    GA_INITIALIZED: boolean
  }
}

const Heading = (): ReactElement<any> => {
  useEffect(() => {
    if (!window.GA_INITIALIZED) {
      initGA()
      window.GA_INITIALIZED = true
    }
    logPageView()
  }, [])

  return (
    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0" />
      <meta name="theme-color" content="#ffffff" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <link rel="shortcut icon" href={SITE_FAVICON} />

      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"
        integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49"
        crossOrigin="anonymous"
      />
    </Head>
  )
}

export default Heading
