import Link from 'next/link'
import { ReactElement } from 'react'
import LazyLoad from 'react-lazy-load'
import styled from 'styled-components'

import {
  ALLBIRDS_GRAY,
  CLUBS_GREY_LIGHT,
  H1_TEXT,
  HOVER_GRAY,
  WHITE,
} from '../constants/colors'
import {
  ANIMATION_DURATION,
  BORDER_RADIUS,
  CARD_HEADING,
  mediaMaxWidth,
  SM,
} from '../constants/measurements'
import { CLUB_ROUTE } from '../constants/routes'
import { Club } from '../types'
import ClubDetails from './ClubDetails'
import { InactiveTag, TagGroup } from './common'

const CardWrapper = styled.div`
  ${mediaMaxWidth(SM)} {
    padding-top: 0;
    padding-bottom: 1rem;
  }
`

const Description = styled.p`
  margin-top: 0.2rem;
  color: ${CLUBS_GREY_LIGHT};
  width: 100%;
`

type CardProps = {
  readonly hovering?: boolean
  className?: string
}

const Card = styled.div<CardProps>`
  padding: 10px;
  box-shadow: 0 0 0 transparent;
  transition: all ${ANIMATION_DURATION}ms ease;
  border-radius: ${BORDER_RADIUS};
  box-shadow: 0 0 0 ${WHITE};
  background-color: ${({ hovering }) => (hovering ? HOVER_GRAY : WHITE)};
  border: 1px solid ${ALLBIRDS_GRAY};
  justify-content: space-between;
  height: auto;
  cursor: pointer;

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

const Image = styled.img`
  max-height: 100%;
  max-width: 150px;
  border-radius: ${BORDER_RADIUS};
  border-radius: 4px;
  overflow: hidden;
`

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 3px;
`

export const CardTitle = styled.strong`
  line-height: 1.2;
  color: ${H1_TEXT};
  margin-bottom: 0.5rem;
  font-weight: ${CARD_HEADING};
`

const shorten = (desc: string): string => {
  if (desc.length < 250) return desc
  return desc.slice(0, 250) + '...'
}

type ClubCardProps = {
  club: Club
  fullWidth?: boolean
}

const ClubCard = ({ club, fullWidth }: ClubCardProps): ReactElement => {
  const {
    name,
    active,
    approved,
    subtitle,
    tags,
    enables_subscription,
    code,
  } = club
  const img = club.image_url
  const textDescription = shorten(subtitle || 'This club has no description.')

  return (
    <CardWrapper className={fullWidth ? '' : 'column is-half-desktop'}>
      <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(code)}>
        <a target="_blank">
          <Card className="card">
            <div style={{ display: 'flex' }}>
              <div style={{ flex: 1 }}>
                <div>
                  <CardHeader>
                    <CardTitle className="is-size-5">{name}</CardTitle>
                  </CardHeader>
                </div>
                {!active && (
                  <InactiveTag className="tag is-rounded">Inactive</InactiveTag>
                )}
                {approved === null && (
                  <InactiveTag className="tag is-rounded">
                    Pending Approval
                  </InactiveTag>
                )}
                {approved === false && (
                  <InactiveTag className="tag is-rounded">Rejected</InactiveTag>
                )}
                <TagGroup tags={tags} />
              </div>
              {img && (
                <LazyLoad height={62} offset={800}>
                  <Image src={img} alt={`${name} Logo`} />
                </LazyLoad>
              )}
            </div>

            <Description>{textDescription}</Description>

            <ClubDetails club={club} />
          </Card>
        </a>
      </Link>
    </CardWrapper>
  )
}

export default ClubCard
