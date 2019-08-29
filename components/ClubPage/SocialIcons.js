import { CLUBS_GREY } from '../../constants/colors.js'
import s from 'styled-components'

const socials = [
  {
    name: 'facebook',
    label: 'Facebook',
    icon: 'fab fa-facebook-square'
  },
  {
    name: 'email',
    label: 'Email',
    prefix: 'mailto:',
    icon: 'fas fa-envelope'
  },
  {
    name: 'website',
    label: 'Website',
    icon: 'fa fa-link'
  },
  {
    name: 'github',
    label: 'GitHub',
    icon: 'fab fa-github'
  },
  {
    name: 'linkedin',
    label: 'LinkedIn',
    icon: 'fab fa-linkedin'
  },
  {
    name: 'instagram',
    label: 'Instagram',
    icon: 'fab fa-instagram'
  },
  {
    name: 'twitter',
    label: 'Twitter',
    icon: 'fab fa-twitter'
  }
]

const Icon = s.a`
  color: ${CLUBS_GREY};
  padding-right: 5px;
`

export default (props) => {
  const { club } = props
  return (
    <div>
      {socials.map((data, idx) => {
        data.index = idx
        return data
      })
        .filter(item => club[item.name])
        .map(item => (
          <div key={item.name}>
            <Icon href={club[item.name] ? (item.prefix || '') + club[item.name] : undefined}>
              <i className={'fa-fw ' + item.icon} style={{ height: '100%' }}></i>{' '}{club[item.name]}
            </Icon>
          </div>
        ))
      }
    </div>
  )
}
