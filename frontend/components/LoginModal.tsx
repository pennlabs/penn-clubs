import { ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { DARK_GRAY } from '../constants/colors'
import { getCurrentRelativePath, LOGIN_URL } from '../utils'
import { SITE_LOGO, SITE_NAME } from '../utils/branding'
import { Loading, Modal } from './common'

const Logo = styled.img`
  width: 100px;
  margin-top: 12%;
`

const ModalTitle = styled.h1`
  color: ${DARK_GRAY};
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.125;
  margin: 2% 0;
`

type Props = {
  show: boolean
  closeModal: () => void
}

const LoginModal = ({ show, ...props }: Props): ReactElement<any> => {
  const [newlyMounted, setNewlyMounted] = useState(true)
  useEffect(() => {
    newlyMounted && setNewlyMounted(false)
  })
  return (
    <Modal show={show} {...props}>
      {newlyMounted ? (
        <Loading />
      ) : (
        <>
          <Logo src={SITE_LOGO} alt={`${SITE_NAME} Logo`} />
          <ModalTitle>Uh oh!</ModalTitle>
          This feature requires a Penn login.
          <br />
          Please{' '}
          <a href={`${LOGIN_URL}?next=${getCurrentRelativePath()}`}>
            log in using your PennKey
          </a>{' '}
          to continue.
        </>
      )}
    </Modal>
  )
}

export default LoginModal
