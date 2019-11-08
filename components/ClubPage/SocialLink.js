const SocialLink = ({ club, item, type }) => {
  let url
  let text

  if (type === 'email') {
    const email = club[item.name]
    url = `mailto:${email}`
    text = email
  } else {
    url = club[item.name]
    text = url
  }

  return <a href={url}> {text}</a>
}

export default SocialLink
