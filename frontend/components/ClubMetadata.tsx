import { ReactElement, useEffect, useState } from 'react'

import { CLUB_ROUTE } from '../constants/routes'
import { Club } from '../types'
import { Metadata } from './common'

const getTwitterUsername = (url: string) => {
  if (typeof url === 'string') {
    const captured = url.match(/https:\/\/twitter\.com\/([a-zA-Z0-9_]+)\/?/)
    if (Array.isArray(captured) && captured.length > 0) return captured[0]
  }
  return url
}

type Props = {
  club: Club | null
}

const ClubMetadata = ({ club }: Props): ReactElement<any> | null => {
  if (!club) {
    return null
  }
  const {
    name,
    code,
    description,
    image_url: image,
    twitter: twitterUrl,
  } = club
  const twitter = getTwitterUsername(twitterUrl)
  const [baseUrl, setBaseUrl] = useState<string>('')
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

export default ClubMetadata
