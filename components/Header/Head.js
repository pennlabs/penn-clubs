import React from 'react'
import Head from 'next/head'

import { initGA, logPageView } from '../../utils/analytics'

// Data to populate site metadata
const title = 'Penn Clubs'
const keywords = [
  'clubs', 'penn', 'upenn', 'labs', 'org', 'organization', 'student',
  'undergrad', 'peer', 'leadership', 'community', 'university', 'college',
  'wharton', 'seas', 'school'
].join(', ')
const author = 'Penn Labs <contact@pennlabs.org>'
const description = 'Penn Clubs is your central source of information about student organizations at the University of Pennsylvania. Keep discovering new clubs throughout the year.'
const url = 'https://pennclubs.com'
const image = 'https://pennlabs-assets.s3.amazonaws.com/metadata-images/penn-clubs.png'
const imageAlt = 'Penn Clubs logo'
const type = 'website'
const twitterUsername = '@pennlabs'
const twitterCardType = 'summary'

export default class Heading extends React.Component {
  componentDidMount() {
    if (!window.GA_INITIALIZED) {
      initGA()
      window.GA_INITIALIZED = true
    }
    logPageView()
  }

  render() {
    return (
      <Head>
        <title>{title}</title>

        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={author} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta property="og:title" content={title} />
        <meta property="og:type" content={type} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={image} />
        <meta property="og:image:alt" content={imageAlt} />

        <meta property="twitter:site" content={twitterUsername} />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:image" content={image} />
        <meta property="twitter:image:alt" content={imageAlt} />
        <meta property="twitter:card" content={twitterCardType} />

        <link rel="shortcut icon" href="/static/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css"
        />
        <link rel="stylesheet"
          href="https://use.fontawesome.com/releases/v5.2.0/css/all.css"
          integrity="sha384-hWVjflwFxL6sNzntih27bfxkr27PmbbK/iSvJ+a4+0owXq79v+lsFkW54bOGbiDQ"
          crossOrigin="anonymous"
        />
        <link href="https://fonts.googleapis.com/css?family=Roboto&display=swap" rel="stylesheet" />
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"
          integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49"
          crossOrigin="anonymous"
        />
      </Head>
    )
  }
}
