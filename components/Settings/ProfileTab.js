import s from 'styled-components'
import { BODY_FONT } from '../../constants/styles'

const Card = s.div`
  justify-content: space-between;
  height: 100%;
  font-family: ${BODY_FONT};
  font-size: 18px;
`

export default (props) => {
  const { name, username, email } = props.defaults

  return (
    <Card>
      <div className="columns is-mobile">
        <div className="column is-narrow" style={{ fontWeight: 600 }}>
          <div>Name:</div>
          <div>Username:</div>
          <div>Email:</div>
        </div>
        <div className="column is-narrow">
          <div>{name}</div>
          <div>{username}</div>
          <div>{email}</div>
        </div>
      </div>
      <div style={{ fontSize: 12 }}>
        If your information is incorrect, please send an email to <b><a href="mailto:contact@pennclubs.com">contact@pennclubs.com</a></b> detailing your issue.
      </div>
    </Card>
  )
}
