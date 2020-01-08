import s from 'styled-components'

import { Icon } from './common/Icon'
import { ALLBIRDS_GRAY, LIGHT_GRAY, DARK_GRAY } from '../constants/colors'
import { BORDER_RADIUS_LG, MD, SM, mediaMaxWidth } from '../constants/measurements'
import { LOGIN_URL } from '../utils'

const Logo = s.img`
  width: 100px
  margin-top: 12%;
`

const ModalWrapper = s.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  z-index: 1002;
  text-align: center;
`

const ModalCard = s.div`
  border-radius: ${BORDER_RADIUS_LG};
  border: 0 !important;
  box-shadow: none !important;
  height: auto;
  width: 35%;

  ${mediaMaxWidth(MD)} {
    width: 50%;
  }

  ${mediaMaxWidth(SM)} {
    width: 90%;
  }
`

const ModalTitle = s.h1`
  color: ${DARK_GRAY};
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.125;
  margin: 2% 0;
`

const ModalContent = s.div`
  margin: auto;
  margin-bottom: 10%;
`

const CloseModalIcon = s(Icon)`
  position: absolute;
  right: 20px;
  top: 20px;
  cursor: pointer;
  color: ${LIGHT_GRAY};
`

const ModalBackground = s.div`
  background-color: ${ALLBIRDS_GRAY};
  opacity: .75;
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
`

export default ({ closeModal }) => (
  <ModalWrapper className="modal is-active" id="modal">
    <ModalBackground
      className='modal-background'
      onClick={closeModal}
    />
    <ModalCard className='card'>
      <CloseModalIcon
        name='x'
        alt='x'
        onClick={closeModal}
      />
      <ModalContent>
        <Logo src="/static/img/peoplelogo.png" alt="Penn Clubs Logo" />
        <ModalTitle>Uh oh!</ModalTitle>
        This feature requires a Penn login.
        <br />
        Please <a href={`${LOGIN_URL}?next=${window.location.href}`}>log in using your PennKey</a> to continue.
      </ModalContent>
    </ModalCard>
  </ModalWrapper>
)
