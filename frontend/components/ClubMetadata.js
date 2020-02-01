import { Metadata } from './common'
import { CLUB_ROUTE } from '../constants/routes'
import { useState, useEffect } from 'react'

const getTwitterUsername = url => {
  if (typeof url === 'string') {
    const captured = url.match(/https:\/\/twitter\.com\/([a-zA-Z0-9_]+)\/?/)
    if (Array.isArray(captured) && captured.length > 0) return captured[0]
  }
  return url
}

export default ({
  club: {
    name,
    code,
    description,
    image,
    twitter: twitterUrl,
  },
}) => {
  const twitter = getTwitterUsername(twitterUrl)
  const [baseUrl, setBaseUrl] = useState('')
  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  return (
    <Metadata
      title={name}
      description={description}
      url={`${baseUrl}${CLUB_ROUTE(code)}`}
      image={image}
      imageAlt={name}
      twitterUsername={twitter}
    />
  )
}
