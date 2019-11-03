const SocialLink = ({ club, item, type }) => {
  let url

  if (type === 'email') {
    url = `mailto:${club[item.name]}`
  } else {
    url = club[item.name]
  }

  return <a href={url}>{' '}{club.name}</a>
}

export default SocialLink
