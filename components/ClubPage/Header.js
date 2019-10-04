import s from 'styled-components'
import { CLUBS_GREY, CLUBS_BLUE, WHITE } from '../../constants/colors'
import { ROLE_OFFICER } from '../../utils'
import { Link } from '../../routes'

const Title = s.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  padding-right: 10px;
`

export default (props) => {
  const { club, userInfo } = props
  // inClub is set to the membership object if the user is in the club, or false otherwise
  const inClub = userInfo && (userInfo.membership_set.filter((a) => a.id === club.code) || [false])[0]

  // a user can e dit a club if they are either a superuser or in the club and at least an officer
  const canEdit = (inClub && inClub.role <= ROLE_OFFICER) || (userInfo && userInfo.is_superuser)
  return (
    <div>
      <Title>
        <h1 className='title is-size-1-desktop is-size-3-mobile' style={{ color: CLUBS_GREY, marginBottom: 10 }} >
          {club.name} {club.active || <span className='has-text-grey'>(Inactive)</span>}
        </h1>
        <span style={{ fontSize: '1.5em' }}>
          {club.favorite_count} <i className={(props.favorites.includes(club.code) ? 'fa' : 'far') + ' fa-heart'} style={{ cursor: 'pointer' }} onClick={() => props.updateFavorites(club.code) ? club.favorite_count++ : Math.max(0, club.favorite_count--)}></i>
          {canEdit && <Link route='club-edit' params={{ club: club.code }}><a className='button is-success' style={{ marginLeft: 15 }}>Edit Club</a></Link>}
        </span>
      </Title>
      <div style={{ marginBottom: 20 }}>
        {club.tags.map(tag => <span key={tag.id} className="tag is-rounded" style={{ backgroundColor: CLUBS_BLUE, color: WHITE, margin: 3 }}>{tag.name}</span>)}
      </div>
    </div>
  )
}
