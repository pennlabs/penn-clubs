import { useRef, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import s from 'styled-components'

import Shade from './Shade'
import { Icon } from './common/Icon'
import { LIGHT_GRAY } from '../constants/colors'
import {
  BORDER_RADIUS_LG,
  MD,
  SM,
  mediaMaxWidth,
  LONG_ANIMATION_DURATION,
} from '../constants/measurements'
import { fadeIn, fadeOut } from '../constants/animations'

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
  animation-name: ${({ show }) => (show ? fadeIn : fadeOut)};
  animation-duration: ${LONG_ANIMATION_DURATION};
`

const ModalCard = s.div`
  border-radius: ${BORDER_RADIUS_LG};
  border: 0 !important;
  box-shadow: none !important;
  height: auto;
  width: 35%;
  animation-name: ${({ show }) => (show ? fadeIn : fadeOut)};
  animation-duration: ${LONG_ANIMATION_DURATION};

  ${mediaMaxWidth(MD)} {
    width: 50%;
  }

  ${mediaMaxWidth(SM)} {
    width: 90%;
  }
`

const CloseModalIcon = s(Icon)`
  position: absolute;
  right: 20px;
  top: 20px;
  cursor: pointer;
  color: ${LIGHT_GRAY};
  animation-name: ${({ show }) => (show ? fadeIn : fadeOut)};
  animation-duration: ${LONG_ANIMATION_DURATION};
`

// Do not propagate events on the modal content to the modal background
// This would otherwise cause the modal to close on any click
const noop = event => event.stopPropagation()

const Modal = ({ show, children, closeModal }) => {
  const [isNewlyMounted, setNewlyMounted] = useState(true)
  const focusRef = useRef()

  const handleKeyPress = ({ key, keyCode }) => {
    const ESCAPE_KEY_CODE = 27
    if ((keyCode === ESCAPE_KEY_CODE || key.toLowerCase() === 'escape') && show) {
      closeModal()
    }
  }

  useEffect(() => {
    isNewlyMounted && setNewlyMounted(false)
    show && focusRef.current.focus()
  }, [show])

  return (
    <ModalWrapper className={show ? 'modal is-active' : 'modal'} id="modal">
      <Shade
        className='modal-background'
        onClick={closeModal}
        show={show}
        onKeyPress={handleKeyPress}
        onKeyDown={handleKeyPress}
      />
      <CloseModalIcon show={show} />
      <ModalCard
        className='card'
        onClick={noop}
        show={show}
      >
        {children}
      </ModalCard>
    </ModalWrapper>
  )
}

Modal.propTypes = {
  show: PropTypes.bool.isRequired,
  children: PropTypes.any.isRequired,
}

export default Modal
