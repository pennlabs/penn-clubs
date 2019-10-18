import Icon from '../common/Icon'
import SocialLink from './SocialLink'

const socials = [
  {
    name: 'facebook',
    label: 'Facebook',
    icon: 'facebook',
  },
  {
    name: 'email',
    label: 'Email',
    prefix: 'mailto:',
    icon: 'mail',
  },
  {
    name: 'website',
    label: 'Website',
    icon: 'link',
  },
  {
    name: 'github',
    label: 'GitHub',
    icon: 'github',
  },
  {
    name: 'linkedin',
    label: 'LinkedIn',
    icon: 'linkedin',
  },
  {
    name: 'instagram',
    label: 'Instagram',
    icon: 'instagram',
  },
  {
    name: 'twitter',
    label: 'Twitter',
    icon: 'twitter',
  },
]

const iconStyles = {
  opacity: 0.5,
  marginRight: '5px',
}

export default props => {
  const { club } = props
  return (
    <div>
      {socials
        .map((data, idx) => {
          data.index = idx
          return data
        })
        .filter(item => club[item.name])
        .map(item => (
          <div key={item.name} style={{ marginBottom: '5px' }}>
            <Icon style={iconStyles} name={item.icon} alt={item.icon} />
            <a
              href={
                club[item.name] ? (item.prefix || '') + club[item.name] : '#'
              }
            >
              <SocialLink club={club} item={item} type={item.name} />
            </a>
          </div>
        ))}
    </div>
  )
}
