import { ReactElement, useEffect, useRef } from 'react'
import s from 'styled-components'

import { fadeIn, fadeOut } from '../../constants/animations'
import { LIGHT_GRAY } from '../../constants/colors'
import {
  BORDER_RADIUS_LG,
  LONG_ANIMATION_DURATION,
  MD,
  mediaMaxWidth,
  SM,
} from '../../constants/measurements'
import { Icon } from './Icon'
import Shade from './Shade'

type ModalWrapperProps = {
  show?: boolean
  width?: string
}

const ModalWrapper = s.div<ModalWrapperProps>`
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: ${({ width }) => width || '100%'};
  overflow-x: hidden;
  overflow-y: auto;
  z-index: 1002;
  text-align: center;
  animation-name: ${({ show }) => (show ? fadeIn : fadeOut)};
  animation-duration: ${LONG_ANIMATION_DURATION};
`

const ModalCard = s.div<{ width?: string }>`
  border-radius: ${BORDER_RADIUS_LG};
  border: 0 !important;
  box-shadow: none !important;
  height: auto;
  width: ${({ width }) => width || '35%'};

  ${mediaMaxWidth(MD)} {
    width: 50%;
  }

  ${mediaMaxWidth(SM)} {
    width: 90%;
  }
`

type ModalContentProps = {
  marginBottom?: boolean
}

const ModalContent = s.div<ModalContentProps>`
  margin: auto;
  ${({ marginBottom }) => (marginBottom ? 'margin-bottom: 10%;' : '')}
`

const CloseModalIcon = s(Icon)<{ onClick?: () => void }>`
  position: absolute;
  right: 20px;
  top: 20px;
  cursor: pointer;
  color: ${LIGHT_GRAY};
`

// Do not propagate events on the modal content to the modal background
// This would otherwise cause the modal to close on any click
const noop = (event) => event.stopPropagation()

export const Modal = ({
  show,
  children,
  closeModal,
  marginBottom = true,
  width,
}: ModalProps): ReactElement => {
  const focusRef = useRef<HTMLDivElement>(null)

  const handleKeyPress = ({ key, keyCode }) => {
    const ESCAPE_KEY_CODE = 27
    if (
      (keyCode === ESCAPE_KEY_CODE || key.toLowerCase() === 'escape') &&
      show
    ) {
      closeModal()
    }
  }

  useEffect(() => {
    if (show && focusRef.current) {
      focusRef.current.focus()
    }
  }, [show])

  return (
    <ModalWrapper
      ref={focusRef}
      className={show ? 'modal is-active' : 'modal'}
      onKeyPress={handleKeyPress}
      onKeyDown={handleKeyPress}
      tabIndex={0}
      show={show}
    >
      <Shade className="modal-background" onClick={closeModal} show={show} />
      <ModalCard width={width} className="card" onClick={noop}>
        <CloseModalIcon name="x" alt="&#215;" onClick={closeModal} />
        <ModalContent marginBottom={marginBottom}>{children}</ModalContent>
      </ModalCard>
    </ModalWrapper>
  )
}

type ModalProps = React.PropsWithChildren<{
  show: boolean
  marginBottom?: boolean
  closeModal: () => void
  width?: string
}>

export default Modal
