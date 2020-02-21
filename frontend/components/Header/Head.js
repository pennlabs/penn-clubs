import { useEffect } from 'react'
import Head from 'next/head'
import { initGA, logPageView } from '../../utils/analytics'

const Heading = () => {
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

      <link rel="shortcut icon" href="/static/favicon.ico" />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css"
      />
      <link
        href="https://fonts.googleapis.com/css?family=Roboto&display=swap"
        rel="stylesheet"
      />
      <link rel="stylesheet" href="../public/static/fonts/fonts.css" />
      <script
        src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"
        integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49"
        crossOrigin="anonymous"
      />
    </Head>
  )
}

export default Heading
