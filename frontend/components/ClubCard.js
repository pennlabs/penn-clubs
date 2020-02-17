import s from 'styled-components'
import LazyLoad from 'react-lazy-load'
import {
  CLUBS_GREY,
  CLUBS_GREY_LIGHT,
  WHITE,
  HOVER_GRAY,
  ALLBIRDS_GRAY,
} from '../constants/colors'
import {
  BORDER_RADIUS,
  mediaMaxWidth,
  SM,
  ANIMATION_DURATION,
} from '../constants/measurements'
import { CLUB_ROUTE } from '../constants/routes'
import { stripTags } from '../utils'
import { InactiveTag, TagGroup } from './common'
import ClubDetails from './ClubDetails'
import Link from 'next/link'

const CardWrapper = s.div`
  ${mediaMaxWidth(SM)} {
    padding-top: 0;
    padding-bottom: 1rem;
  }
`

const Description = s.p`
  margin-top: 0.2rem;
  color: ${CLUBS_GREY_LIGHT};
  width: 100%;
`

const Card = s.div`
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

const Image = s.img`
  height: 100%;
  max-width: 150px;
  border-radius: ${BORDER_RADIUS};
  border-radius: 4px;
  overflow: hidden;
`

const CardHeader = s.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 3px;
`

const CardTitle = s.strong`
  line-height: 1.2;
  color: ${CLUBS_GREY};
  margin-bottom: 0.5rem;
`

const shorten = desc => {
  if (desc.length < 250) return desc
  return desc.slice(0, 250) + '...'
}

const ClubCard = ({ club, updateFavorites, favorite }) => {
  const {
    name,
    active,
    description,
    subtitle,
    tags,
    accepting_members: acceptingMembers,
    size,
    code,
    application_required: applicationRequired,
  } = club
  const img = club.image_url
  const textDescription = shorten(
    subtitle || stripTags(description) || 'This club has no description.'
  )

  return (
    <CardWrapper className="column is-half-desktop">
      <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(code)}>
        <a>
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
                <TagGroup tags={tags} />
              </div>
              {img && (
                <LazyLoad height={62} offset={800}>
                  <Image src={img} alt={`${name} Logo`} />
                </LazyLoad>
              )}
            </div>

            <Description>{textDescription}</Description>

            <ClubDetails
              size={size}
              applicationRequired={applicationRequired}
              acceptingMembers={acceptingMembers}
              club={club}
              favorite={favorite}
              updateFavorites={updateFavorites}
            />
          </Card>
        </a>
      </Link>
    </CardWrapper>
  )
}

export default ClubCard
