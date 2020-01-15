import React from 'react'
import s from 'styled-components'

import { CLUBS_GREY, CLUBS_GREY_LIGHT } from '../constants/colors'
import {
  mediaMaxWidth,
  mediaMinWidth,
  MD,
  LG,
  ANIMATION_DURATION,
} from '../constants/measurements'
import { TagGroup } from './common'
import ClubDetails from './ClubDetails'
import Link from 'next/link'
import {
  doApiRequest,
  formatResponse
} from '../utils'

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

const time_format = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "2-digit",
  hour: "numeric",
  minute: "numeric"
})

class EventTableRow extends React.Component {

  render() {
    const {
      club,
      event,
      deleteEvent
    } = this.props

    return (
      <Row>
        <div className="columns is-gapless is-mobile">
          <div className="column">
            <div className="columns is-gapless">
              <div className="column is-4-desktop is-12-mobile">
                <p
                  className="is-size-6"
                  style={{ color: CLUBS_GREY, marginBottom: '0.2rem' }}
                >
                  <strong>{event.name}</strong>
                </p>
                <p>
                  {event.location}
                </p>
              </div>
              <div className="column is-6-desktop is-9-mobile">
                <Content>
                  <p dangerouslySetInnerHTML={{__html: event.description}}></p>
                  <Subtitle>
                    {new Intl.DateTimeFormat("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "2-digit",
                      hour: "numeric",
                      minute: "numeric"
                    }).format(new Date(event.start_time))} - {new Intl.DateTimeFormat("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "2-digit",
                      hour: "numeric",
                      minute: "numeric"
                    }).format(new Date(event.end_time))}
                  </Subtitle>
                </Content>
              </div>
              <div className="column is-9-desktop is-16-mobile">
                <button style={{marginTop: "0.5em"}} onClick={() => deleteEvent(event.id)}
                        className="button is-danger">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </Row>
    )
  }
}

export default EventTableRow
