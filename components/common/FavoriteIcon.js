import s from 'styled-components'
import { CLUBS_GREY } from '../../colors'

const FavoriteIcon = s.span`
  color: ${CLUBS_GREY};
  float: right;
  padding: 10px 10px 0 0;
  cursor: pointer;
`

export default (props) => (
  <FavoriteIcon onClick={(e) => { props.updateFavorites(props.club.id); e.stopPropagation() }} className="icon">
    <i className={(props.favorite ? 'fas' : 'far') + ' fa-heart'} ></i>
  </FavoriteIcon>
)
