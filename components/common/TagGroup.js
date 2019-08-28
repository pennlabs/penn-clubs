import s from 'styled-components'
import { CLUBS_BLUE } from '../../constants/colors'

const Tag = s.span`
  background-color: ${CLUBS_BLUE} !important;
  margin: 2px;
  font-size: .7em;
`

export default (props) => {
  if (!props.tags) return null
  return (
    <div>
      {props.tags.map(tag => <Tag key={tag.id} className="tag is-rounded has-text-white">{tag.name}</Tag>)}
    </div>
  )
}
