import s from 'styled-components'
import { BODY_FONT } from '../../constants/styles'
import { SmallText } from '../common'

const Wrapper = s.div`
  font-family: ${BODY_FONT};
  font-size: 18px;
`

export default props => {
  const { name, username, email } = props.defaults

  return (
    <Wrapper>
      <div className="columns is-mobile">
        <div className="column is-narrow" style={{ fontWeight: 600 }}>
          <div>Name</div>
          <div>Username</div>
          <div>Email</div>
        </div>
        <div className="column is-narrow">
          <div>{name}</div>
          <div>{username}</div>
          <div>{email}</div>
        </div>
      </div>
      <div>
        <SmallText>
          If your information is incorrect, please send an email to{' '}
          <a href="mailto:contact@pennclubs.com">contact@pennclubs.com</a>{' '}
          detailing your issue.
        </SmallText>
      </div>
    </Wrapper>
  )
}
