import s from 'styled-components'
import { CLUBS_BLUE } from '../../constants/colors'

const Tag = s.span`
  background-color: ${CLUBS_BLUE} !important;
  margin: 2px;
  font-size: .7em;
`

export default (props) => {
  const { tags } = props
  if (!tags || !tags.length) return null
  return (
    <div>
      {tags.map(({ id, name }) => (
        <Tag key={id} className="tag is-rounded has-text-white">{name}</Tag>
      ))}
    </div>
  )
}
