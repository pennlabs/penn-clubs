import { DARK_GRAY } from '../../constants/colors'
import { BODY_FONT } from '../../constants/styles'
import s from 'styled-components'
import Toggle from './Toggle'
import { Icon } from '../common'
import ReactTooltip from 'react-tooltip'
import Link from 'next/link'

const Table = s.table`
  font-family: ${BODY_FONT};
  font-size: 16px;
  overflow: scroll;
  color: ${DARK_GRAY} !important;
`

export default props => {
  const { userInfo, togglePublic, toggleActive, leaveClub } = props
  const isMemberOfAnyClubs = !(
    userInfo &&
    userInfo.membership_set &&
    userInfo.membership_set.length
  )

  return (
    <Table className="table is-fullwidth">
      <thead>
        <tr>
          <th>Club</th>
          <th>Position</th>
          <th>
            Permissions
            <Icon
              data-tip="Shows your level of access to club management tools. Can be a Member, Officer, or Owner."
              data-effect="solid"
              data-multiline="true"
              name="info"
              alt="?"
              style={{ paddingLeft: 4 }}
            />
            <ReactTooltip style={{ width: 50 }} />
          </th>
          <th>
            Active
            <Icon
              data-tip="Toggle whether you’re currently an active member of the club"
              data-effect="solid"
              data-multiline="true"
              name="info"
              alt="?"
              style={{ paddingLeft: 4 }}
            />
            <ReactTooltip style={{ width: 50 }} />
          </th>
          <th>
            Public
            <Icon
              data-tip="Toggle if you would like to be listed as a member on the club’s page"
              data-effect="solid"
              name="info"
              alt="?"
              style={{ paddingLeft: 4 }}
            />
            <ReactTooltip width="50px" />
          </th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {isMemberOfAnyClubs ? (
          <tr>
            <td className="has-text-grey" colSpan="4">
              You are not a member of any clubs yet.
            </td>
          </tr>
        ) : (
          userInfo.membership_set.map(item => (
            <tr key={item.code}>
              <td>
                <Link
                  href="/club/[club]"
                  as={`/club/${item.code}`}
                >
                  {item.name}
                </Link>
              </td>
              <td>{item.title}</td>
              <td>{item.role_display}</td>
              <td>
                <Toggle
                  club={item}
                  active={item.active}
                  toggle={club => toggleActive(club)}
                />
              </td>
              <td>
                <Toggle
                  club={item}
                  active={item.public}
                  toggle={club => togglePublic(club)}
                />
              </td>
              <td>
                {item.role_display === 'Admin' ? (
                  <button className="button is-small">Manage</button>
                ) : (
                  <button
                    className="button is-small"
                    onClick={() => leaveClub(item)}
                  >
                    Leave
                  </button>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  )
}
