import { css } from '@emotion/react'
import { DateTime, Settings } from 'luxon'
import { type CSSProperties, useState } from 'react'
import styled from 'styled-components'

import { Icon, Title } from '~/components/common'
import {
  ALLBIRDS_GRAY,
  BULMA_SUCCESS,
  CLUBS_BLUE,
  CLUBS_GREY_LIGHT,
  CLUBS_YELLOW,
  HOVER_GRAY,
  HUB_SNOW,
  WHITE,
} from '~/constants'
import {
  ANIMATION_DURATION,
  BORDER_RADIUS,
  mediaMaxWidth,
  SM,
} from '~/constants/measurements'
import { CountedEventTicket } from '~/types'

Settings.defaultZone = 'America/New_York'

type CardProps = {
  readonly hovering?: boolean
  className?: string
}

const Card = styled.div<CardProps>`
  padding: 10px;
  margin-top: 1rem;
  box-shadow: 0 0 0 transparent;
  transition: all ${ANIMATION_DURATION}ms ease;
  border-radius: ${BORDER_RADIUS};
  box-shadow: 0 0 0 ${WHITE};
  background-color: ${({ hovering }) => (hovering ? HOVER_GRAY : WHITE)};
  border: 1px solid ${ALLBIRDS_GRAY};
  justify-content: space-between;
  height: auto;

  &:hover,
  &:active,
  &:focus {
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
  }

  ${mediaMaxWidth(SM)} {
    width: calc(100%);
    padding: 8px;
  }
`

const Description = styled.p`
  margin-bottom: 0.5rem;
  color: ${CLUBS_GREY_LIGHT};
  width: 100%;
`

const formatTime = (startTime: string, endTime: string) => {
  const startDateTime = DateTime.fromISO(startTime)
  const endDateTime = DateTime.fromISO(endTime)

  const dayDuration = Math.floor(endDateTime.diff(startDateTime, 'days').days)
  const startFormatted = startDateTime.toFormat(
    dayDuration === 0 ? 'h:mm a' : 'MMM d, h:mm a',
  )
  const endFormatted = endDateTime.toFormat(
    dayDuration === 0 ? 'h:mm a z' : 'MMM d, h:mm a z',
  )

  return {
    month: startDateTime.toFormat('LLL'),
    day: startDateTime.day,
    timeRange: `${startFormatted} — ${endFormatted}`,
    dayDuration,
  }
}

function generateBoxShadow(collapsed) {
  let boxShadow = ''
  boxShadow += '0 1px 6px rgba(0, 0, 0, 0.2),\n'
  for (let i = 1; i <= collapsed; i++) {
    boxShadow += `${i * 10}px -${i * 10}px 0 -1px ${HUB_SNOW}, ${i * 10}px -${i * 10}px rgba(0, 0, 0, 0.1)${
      i !== collapsed ? ',\n' : ''
    }`
  }
  return boxShadow
}

export const TicketCard = ({
  collapsed = 0,
  ticket,
  showModal,
  style,
  removable,
  editable,
  hideActions,
  onRemove,
  onChange,
  onClick,
  viewQRCode,
}: {
  collapsed?: number
  ticket: CountedEventTicket

  style?: CSSProperties
  hideActions?: boolean

  removable?: boolean
  editable?: boolean

  onRemove?: () => void
  onChange?: (count: number) => void
  onClick?: () => void

  viewQRCode?: () => void
  showModal?: () => void
}) => {
  const [isEditMode, setIsEditMode] = useState(false)

  const datetimeData = formatTime(
    ticket.event.start_time,
    ticket.event.end_time,
  )

  return (
    <Card
      className="card"
      id={`ticket-${ticket.id}`}
      style={{
        ...style,
        display: 'flex',
        cursor: typeof onClick === 'function' ? 'pointer' : 'default',
        ...(collapsed !== 0
          ? {
              boxShadow: generateBoxShadow(collapsed),
            }
          : {}),
        margin: collapsed !== 0 ? '4rem 0' : '1rem 0',
      }}
      onClick={onClick}
    >
      {typeof ticket.count === 'number' && (
        <div
          css={css`
            display: flex;
            justify-content: center;
            align-items: center;

            width: 120px;
            border-right: 2px dashed #dedede;
            margin-right: 20px;

            font-size: 32px;
            font-weight: 800;
            cursor: pointer;
          `}
          onDoubleClick={() => {
            editable && setIsEditMode(true)
          }}
        >
          {isEditMode && editable ? (
            <input
              style={{
                width: '70px',
                fontSize: '32px',
                fontWeight: 800,
                textAlign: 'center',
              }}
              type="number"
              defaultValue={ticket.count}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditMode(false)
                  onChange?.(parseInt(e.currentTarget.value ?? ticket.count))
                }
              }}
            />
          ) : (
            <span>{ticket.count}</span>
          )}
          <span
            css={css`
              font-size: 14px;
              font-weight: 400;
              margin-left: 4px;
              color: #888;
            `}
          >
            X
          </span>
        </div>
      )}
      <div
        css={css`
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 16px;
          min-width: 100px;
          background: ${CLUBS_BLUE};
          border-radius: 8px;
          color: ${WHITE};
          width: 80px;
          position: relative;
        `}
      >
        <Title
          css={css`
            display: flex;
            align-items: top;
            color: ${WHITE};
          `}
          className="mb-0"
        >
          {datetimeData.day}
          {datetimeData.dayDuration !== 0 && (
            <div
              css={css`
                font-size: 12px;
                position: absolute;
                right: 12px;
                top: 12px;
              `}
            >
              {datetimeData.dayDuration < 0 ? '-' : '+'}{' '}
              {Math.abs(datetimeData.dayDuration)}
            </div>
          )}
        </Title>
        <Description
          style={{
            color: WHITE,
            width: '100%',
            textAlign: 'center',
            marginBottom: 0,
          }}
        >
          {datetimeData.month}
        </Description>
      </div>
      <div
        css={css`
          flex: 1;
          margin-left: 20px;
        `}
      >
        <Description
          style={{
            fontWeight: 600,
          }}
        >
          {ticket.event.name} {ticket.id}
        </Description>
        <Description>{ticket.event.club_name}</Description>
        <Description>
          {ticket.type} | {datetimeData.timeRange}
        </Description>
      </div>
      {editable && (
        <span
          css={css`
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${WHITE};
            border-radius: 50%;
            width: 20px;
            height: 20px;
            background: ${isEditMode ? BULMA_SUCCESS : CLUBS_YELLOW};
            &:hover {
              background: ${CLUBS_GREY_LIGHT};
            }
            margin: 0 4px;
          `}
          onClick={() => {
            setIsEditMode(!isEditMode)
          }}
        >
          <Icon
            style={{
              color: 'white',
              width: '12px',
            }}
            className="is-small"
            name={isEditMode ? 'check' : 'edit'}
            alt={isEditMode ? 'confirm' : 'edit'}
          />
        </span>
      )}
      {removable && (
        <button
          className="delete"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
        />
      )}
      {!hideActions && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <button
              className="button is-primary"
              css={css`
                display: flex;
                align-items: center;
                background-color: ${CLUBS_BLUE} !important;
                border: 1px solid ${CLUBS_BLUE} !important;
                & > *:not(:first-child) {
                  margin-left: 4px;
                  margin-right: 0px;
                  color: ${WHITE};
                }
              `}
              onClick={(e) => {
                e.stopPropagation()
                viewQRCode?.()
              }}
            >
              <span>QR Code</span>
              <Icon name="qr-code" size="1rem" />
            </button>
          </div>
          <div style={{ width: '12px' }} />
          <button
            className="button is-primary"
            css={css`
              display: flex;
              align-items: center;
              & > *:not(:first-child) {
                margin-left: 4px;
                margin-right: 0px;
                color: ${WHITE};
              }
            `}
            onClick={(e) => {
              e.stopPropagation()
              showModal?.()
            }}
          >
            <span>Transfer Ownership</span>
            <Icon name="swap-horiz" size="1rem" />
          </button>
        </div>
      )}
    </Card>
  )
}
