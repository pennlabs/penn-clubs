import Link from 'next/link'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { useRegistrationQueueSettings } from '~/hooks/useRegistrationQueueSettings'

import { mediaMaxWidth, PHONE } from '../constants'
import {
  ALLBIRDS_GRAY,
  BLACK_ALPHA,
  WHITE,
  WHITE_ALPHA,
} from '../constants/colors'
import { BODY_FONT } from '../constants/styles'
import { UserInfo } from '../types'
import { apiCheckPermission } from '../utils'
import {
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
} from '../utils/branding'
import { Icon } from './common'

const DisplayButtonsTag = styled.div`
  float: right;
  font-family: ${BODY_FONT};

  .button {
    margin-left: 8px;
  }

  ${mediaMaxWidth(PHONE)} {
    float: none;
    text-align: right;
    margin-bottom: 1rem;
  }
`

const iconStyles = {
  transform: 'translateY(0px)',
  opacity: 0.6,
  color: `${BLACK_ALPHA(0.8)} !important`,
}

const iconStylesDark = {
  transform: 'translateY(0px)',
  opacity: 0.6,
  color: `${WHITE_ALPHA(0.8)} !important`,
}

const buttonStyles = {
  backgroundColor: WHITE,
  border: `1px solid ${ALLBIRDS_GRAY}`,
  fontFamily: BODY_FONT,
}

const DisplayButtons = ({
  switchDisplay,
  userInfo,
}: DisplayButtonsProps): ReactElement<any> => {
  const { settings: queueSettings } = useRegistrationQueueSettings()
  const canApprove = apiCheckPermission('clubs.approve_club', true) === true
  const isSuperuser = userInfo?.is_superuser === true
  const showRegisterButton =
    queueSettings?.new_approval_queue_open === true || canApprove || isSuperuser

  return (
    <DisplayButtonsTag>
      <button
        onClick={() => switchDisplay('cards')}
        className="button is-small"
        style={buttonStyles}
        aria-label="switch to grid view"
      >
        <Icon name="grid" alt="grid icon" style={iconStyles} />
      </button>
      <button
        onClick={() => switchDisplay('list')}
        className="button is-small"
        style={buttonStyles}
        aria-label="switch to list view"
      >
        <Icon name="list" alt="list icon" style={iconStyles} />
      </button>
      {showRegisterButton && (
        <Link href="/create" className="button is-small is-primary">
          <Icon
            name="plus"
            alt={`register ${OBJECT_NAME_SINGULAR}`}
            style={iconStylesDark}
          />
          Register {OBJECT_NAME_TITLE_SINGULAR}
        </Link>
      )}
    </DisplayButtonsTag>
  )
}

type DisplayButtonsProps = {
  switchDisplay: (disp: 'list' | 'cards') => void
  userInfo?: UserInfo
}

export default DisplayButtons
