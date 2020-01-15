import s from 'styled-components'

import { CLUBS_GREY, CLUBS_GREY_LIGHT } from '../constants/colors'
import { Card, BlueTag, InactiveTag } from './common'

import { BORDER_RADIUS } from '../constants/measurements'
import { CLUB_ROUTE } from '../constants/routes'
import { getDefaultClubImageURL } from '../utils'
import Link from 'next/link'

const Subtitle = s.p`
  color: ${CLUBS_GREY_LIGHT} !important;
  font-size: .8rem;
  padding-left: 10px;
`

const Image = s.img`
  height: 60px;
  width: 90px;
  object-fit: contain;
  border-radius: ${BORDER_RADIUS};
`

// TODO simplify this component further

const ClubList = ({ club, updateFavorites, favorite }) => {
  const { name, subtitle, tags, code } = club
  const img = club.image_url || getDefaultClubImageURL()

  return (
    <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(code)}>
      <Card>
        <div className="columns is-vcentered is-gapless is-mobile">
          <div className="column">
            <div className="columns is-gapless is-vcentered">
              <div className="column is-narrow">
                <Image src={img} />
              </div>
              <div className="column is-4" style={{ marginLeft: 20 }}>
                <strong className="is-size-6" style={{ color: CLUBS_GREY }}>
                  {name}
                </strong>
                <div>
                  {club.active || (
                    <InactiveTag className="tag is-rounded has-text-white">
                      Inactive
                    </InactiveTag>
                  )}
                  {tags.map(tag => (
                    <BlueTag
                      key={tag.id}
                      className="tag is-rounded has-text-white"
                    >
                      {tag.name}
                    </BlueTag>
                  ))}
                </div>
              </div>
              <div className="column">
                <Subtitle>{subtitle}</Subtitle>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default ClubList
