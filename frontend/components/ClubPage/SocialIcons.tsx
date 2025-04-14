import { ReactElement } from 'react'
import styled from 'styled-components'

import { Club } from '../../types'
import { Icon } from '../common'
import SocialLink from './SocialLink'

const socials = [
  {
    name: 'address',
    label: 'Location',
    icon: 'location',
  },
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

const SocialLine = styled.div`
  overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const iconStyles = {
  opacity: 0.5,
  marginRight: '5px',
}

type SocialIconsProps = {
  club: Club
}

const SocialIcons = ({ club }: SocialIconsProps): ReactElement<any> => (
  <>
    {socials
      .filter((item) => club[item.name])
      .map((item) => (
        <SocialLine key={item.name}>
          <Icon style={iconStyles} name={item.icon} alt={item.icon} />{' '}
          <SocialLink club={club} item={item} type={item.label} />
        </SocialLine>
      ))}
  </>
)

export default SocialIcons
