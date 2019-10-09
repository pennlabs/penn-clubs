import { ROLE_OFFICER } from '../../utils'

export default (props) => {
  const { userInfo, togglePublic } = props
  return (
    <div>
      <p>The list below shows what clubs you are a member of. If you would like to hide a particular club from the public, click on the <i className='fa fa-fw fa-check-circle has-text-success'></i> icon under the Public column. This will not hide your membership from other club members.</p>
      <table className='table is-fullwidth'>
        <thead>
          <tr>
            <th>Name</th>
            <th>Position</th>
            <th>Permissions</th>
            <th className='has-text-centered'>Active</th>
            <th className='has-text-centered'>Public</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(userInfo && userInfo.membership_set && userInfo.membership_set.length) ? userInfo.membership_set.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.title}</td>
              <td>{item.role_display}</td>
              <td className='has-text-centered'>
                <i className={item.active ? 'fa fa-check-circle has-text-success' : 'fa fa-times-circle has-text-danger'} />
              </td>
              <td className='has-text-centered'>
                <i style={{ cursor: 'pointer' }} onClick={() => togglePublic(item)} className={item.public ? 'fa fa-check-circle has-text-success' : 'fa fa-times-circle has-text-danger'} />
              </td>
              <td className='buttons'>
                <Link route='club-view' params={{ club: String(item.code) }}>
                  <a className='button is-small is-link'>View</a>
                </Link>
                {item.role <= ROLE_OFFICER && <Link route='club-edit' params={{ club: String(item.code) }}>
                  <a className='button is-small is-success'>Edit</a>
                </Link>}
              </td>
            </tr>
          )) : (
            <tr>
              <td className='has-text-grey' colSpan='4'>
                You are not a member of any clubs yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
