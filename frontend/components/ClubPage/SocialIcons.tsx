import { ReactElement } from 'react'

import { Club } from '../../types'
import { Icon } from '../common'
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
  {
    name: 'youtube',
    label: 'YouTube',
    icon: 'youtube',
  },
]

const iconStyles = {
  opacity: 0.5,
  marginRight: '5px',
}

type SocialIconsProps = {
  club: Club
}

const SocialIcons = ({ club }: SocialIconsProps): ReactElement => (
  <>
    {socials
      .filter((item) => club[item.name])
      .map((item) => (
        <div key={item.name}>
          <Icon style={iconStyles} name={item.icon} alt={item.icon} />{' '}
          <SocialLink club={club} item={item} type={item.name} />
        </div>
      ))}
  </>
)

export default SocialIcons
