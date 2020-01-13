import s from 'styled-components'

import Modal from './common/Modal'
import { LOGIN_URL } from '../utils'
import { DARK_GRAY } from '../constants/colors'
import { LONG_ANIMATION_DURATION } from '../constants/measurements'
import { fadeIn, fadeOut } from '../constants/animations'

const Logo = s.img`
  width: 100px;
  margin-top: 12%;
`

const ModalTitle = s.h1`
  color: ${DARK_GRAY};
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.125;
  margin: 2% 0;
  animation-name: ${({ show }) => (show ? fadeIn : fadeOut)};
  animation-duration: ${LONG_ANIMATION_DURATION};
`

export default props => (
  <Modal {...props} >
    <Logo src="/static/img/peoplelogo.png" alt="Penn Clubs Logo" />
    <ModalTitle>Uh oh!</ModalTitle>
    This feature requires a Penn login.
    <br />
    Please <a href={`${LOGIN_URL}?next=${window.location.href}`}>log in using your PennKey</a> to continue.
  </Modal>
)
