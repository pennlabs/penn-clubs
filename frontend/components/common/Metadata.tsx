import Head from 'next/head'
import Script from 'next/script'
import { ReactElement } from 'react'

import {
  CONTACT_EMAIL,
  DOMAIN,
  OBJECT_NAME_LONG_PLURAL,
  OBJECT_NAME_PLURAL,
  OG_IMAGE,
  SCHOOL_NAME,
  SITE_FAVICON,
  SITE_NAME,
} from '../../utils/branding'

// Data to populate site metadata
const title = SITE_NAME
const keywords = [
  'clubs',
  'penn',
  'upenn',
  'labs',
  'org',
  'organization',
  'student',
  'undergrad',
  'peer',
  'leadership',
  'community',
  'university',
  'college',
  'wharton',
  'seas',
  'school',
].join(', ')
const author = `Penn Labs <${CONTACT_EMAIL}>`
const description = `${SITE_NAME} is your central source of information about ${OBJECT_NAME_LONG_PLURAL} at the ${SCHOOL_NAME}. Keep discovering new ${OBJECT_NAME_PLURAL} throughout the year.`
const url = `https://${DOMAIN}`
const image = OG_IMAGE
const imageAlt = `${SITE_NAME} logo`
const type = 'website'
const twitterUsername = '@pennlabs'
const twitterCardType = 'summary'

export const Metadata = ({
  title,
  keywords,
  author,
  description,
  url,
  image,
  imageAlt,
  type,
  twitterUsername,
  twitterCardType,
}: MetadataProps): ReactElement<any> => (
  <Head>
    <title>{title}</title>

    <meta charSet="utf-8" />
    <meta name="viewport" content="initial-scale=1.0" />
    <meta name="theme-color" content="#ffffff" />
    <meta
      name="description"
      content={description?.replace(/<\/?[^>]+(>|$)/g, '').trim()}
    />
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

    <link rel="shortcut icon" href={SITE_FAVICON} />
    <Script
      src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"
      integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49"
      crossOrigin="anonymous"
    />
  </Head>
)

Metadata.defaultProps = {
  title,
  keywords,
  author,
  description,
  url,
  image,
  imageAlt,
  type,
  twitterUsername,
  twitterCardType,
}

type MetadataProps = {
  title: string
  keywords: string
  author: string
  description: string
  url: string
  image: string
  imageAlt: string
  type: string
  twitterUsername: string
  twitterCardType: string
}
