import Link from 'next/link'
import React from 'react'
import s from 'styled-components'

import { CLUBS_GREY, CLUBS_GREY_LIGHT } from '../constants/colors'
import {
  ANIMATION_DURATION,
  LG,
  MD,
  mediaMaxWidth,
  mediaMinWidth,
} from '../constants/measurements'
import { CLUB_ROUTE } from '../constants/routes'
import { Club } from '../types'
import ClubDetails from './ClubDetails'
import { TagGroup } from './common'

const ROW_PADDING = 0.8

const Row = s.div`
  cursor: pointer;
  border-radius: 4px;
  border-width: 1px;
  border-style: solid;
  border-color: transparent;
  box-shadow: 0 0 0 transparent;
  transition: all ${ANIMATION_DURATION}ms ease;
  padding: ${ROW_PADDING}rem;
  width: calc(100% + ${2 * ROW_PADDING}rem);
  margin: 0 -${ROW_PADDING}rem;

  &:hover {
    border-color: rgba(0, 0, 0, 0.1);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  }

  ${mediaMaxWidth(MD)} {
    margin: 0;
    width: 100%;
    border-radius: 0;
  }
`

const Content = s.div`
  ${mediaMinWidth(LG)} {
    padding: 0 0.75rem;
  }
`

const Subtitle = s.p`
  color: ${CLUBS_GREY_LIGHT};
  font-size: .8rem;
`

const Name = ({ children }) => (
  <p
    className="is-size-6"
    style={{ color: CLUBS_GREY, marginBottom: '0.2rem' }}
  >
    <strong>{children}</strong>
  </p>
)

type ClubTableRowProps = {
  club: Club
  updateFavorites: (code: string) => void
}

class ClubTableRow extends React.Component<ClubTableRowProps> {
  getSubtitle(): string {
    const { club } = this.props
    const { subtitle, description } = club

    if (subtitle) return subtitle

    if (description.length < 200) return description

    return description.substring(0, 200) + '...'
  }

  render(): JSX.Element {
    const { club, updateFavorites } = this.props
    const { name, tags, code } = club

    return (
      <Row>
        <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(code)}>
          <a target="_blank">
            <div className="columns is-gapless is-mobile">
              <div className="column">
                <div className="columns is-gapless">
                  <div className="column is-4-desktop is-12-mobile">
                    <Name>{name}</Name>
                    <div>
                      <TagGroup tags={tags} />
                    </div>
                  </div>
                  <div className="column is-8-desktop is-12-mobile">
                    <Content>
                      <Subtitle>{this.getSubtitle()}</Subtitle>
                      <ClubDetails
                        club={club}
                        updateFavorites={updateFavorites}
                      />
                    </Content>
                  </div>
                </div>
              </div>
            </div>
          </a>
        </Link>
      </Row>
    )
  }
}

export default ClubTableRow
