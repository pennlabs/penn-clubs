import { ReactElement } from 'react'

import { Club } from '../../types'

const stripUrl = (url: string): string => {
  return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').replace(/\/$/, '')
}

type SocialLinkProps = {
  club: Club
  item: { name: string }
  type: string
}

const SocialLink = ({
  club,
  item,
  type,
}: SocialLinkProps): ReactElement<any> => {
  let url, text

  if (type === 'Email') {
    const email = club[item.name]
    if (email === 'Hidden') {
      return email
    }
    url = `mailto:${email}`
    text = email
  } else if (type === 'Location') {
    return club[item.name]
  } else {
    url = club[item.name]
    text = stripUrl(url)
  }

  return <a href={url}> {text}</a>
}

export default SocialLink
