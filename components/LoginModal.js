import s from 'styled-components'

import { Icon } from './common/Icon'
import { ALLBIRDS_GRAY, LIGHT_GRAY, MEDIUM_GRAY } from '../constants/colors'
import { BORDER_RADIUS_LG, MD, SM, mediaMaxWidth } from '../constants/measurements'

const ModalWrapper = s.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  z-index: 1002;

  padding: 1rem 12%;

  ${mediaMaxWidth(MD)} {
    padding: 1rem 6%;
  }

  ${mediaMaxWidth(SM)} {
    padding: 1rem;
  }

  ${mediaMaxWidth(MD)} {
    &.is-active {
        display: block !important;
    }
  }
`

const ModalCard = s.div`
  border-radius: ${BORDER_RADIUS_LG};
  border: 0 !important;
  box-shadow: none !important;
  height: auto;
  width: 100%;

  ${mediaMaxWidth(SM)} {
    max-height: calc(100vh - 2rem);
    overflow: hidden;
    padding-bottom: 140px;
  }
`

const CloseModalIcon = s(Icon)`
  position: absolute;
  right: 10px;
  top: 10px;
  cursor: pointer;
  color: ${LIGHT_GRAY};

  &:hover {
    color: ${MEDIUM_GRAY};
  }
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
  <ModalWrapper className={`modal is-active`} id="modal">
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
      <h1>Uh oh!</h1>
      This feature requires a Penn login.
      <br />
      Please <a>log in using your PennKey</a> to continue.
    </ModalCard>
  </ModalWrapper>
)
