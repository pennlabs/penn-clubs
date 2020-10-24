const stripUrl = (url) => {
  return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').replace(/\/$/, '')
}

const SocialLink = ({ club, item, type }) => {
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
