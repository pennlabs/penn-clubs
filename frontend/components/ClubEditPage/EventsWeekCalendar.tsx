import moment from 'moment'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { CLUBS_NAVY, EVENT_TYPE_COLORS } from '../../constants/colors'
import { ClubEvent, EventShowing } from '../../types'

const INK = CLUBS_NAVY
const RULE = '#D8D8D8'
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8)
const ROW_PX = 39

const Wrap = styled.div`
  background: #ffffff;
  border-radius: 10px;
  min-width: 0;
`

const MonthBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.75rem;
`

const MonthLabel = styled.h3`
  color: ${INK};
  font-size: 18px;
  font-weight: 600;
  line-height: 22px;
  margin: 0;
`

const NavButton = styled.button`
  appearance: none;
  background: transparent;
  border: 0;
  color: ${INK};
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0.15rem 0.35rem;

  &:hover {
    opacity: 0.7;
  }
`

const Grid = styled.div`
  border: 1px solid ${RULE};
  border-radius: 10px;
  overflow: hidden;
`

const DayHeader = styled.div`
  display: grid;
  grid-template-columns: 48px repeat(7, 1fr);
  border-bottom: 1px solid ${RULE};
`

const DayCell = styled.div`
  color: ${INK};
  font-size: 12px;
  font-weight: 600;
  padding: 0.45rem 0.35rem;
  text-align: center;

  span {
    display: block;
    color: #42424f;
    font-size: 11px;
    font-weight: 400;
    margin-top: 2px;
  }
`

const Body = styled.div`
  display: grid;
  grid-template-columns: 48px repeat(7, 1fr);
  position: relative;
`

const HourGutter = styled.div`
  color: #42424f;
  font-size: 11px;
  height: ${ROW_PX}px;
  line-height: ${ROW_PX}px;
  text-align: right;
  padding-right: 6px;
`

const DayCol = styled.div`
  border-left: 1px solid ${RULE};
  min-height: ${HOURS.length * ROW_PX}px;
  position: relative;
`

const HourRule = styled.div`
  border-top: 1px solid ${RULE};
  height: ${ROW_PX}px;
  pointer-events: none;
`

const Block = styled.button<{ $top: number; $height: number; $color: string }>`
  appearance: none;
  background: ${({ $color }) => $color};
  border: 0;
  border-radius: 8px;
  color: ${INK};
  cursor: pointer;
  left: 4px;
  overflow: hidden;
  padding: 4px 6px;
  position: absolute;
  right: 4px;
  text-align: left;
  top: ${({ $top }) => $top}px;
  height: ${({ $height }) => Math.max($height, 28)}px;

  &:hover {
    filter: brightness(0.97);
  }
`

const Title = styled.div`
  font-size: 12px;
  font-weight: 600;
  line-height: 15px;
`

const Meta = styled.div`
  font-size: 11px;
  line-height: 13px;
  margin-top: 2px;
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

type CalendarItem = {
  event: ClubEvent
  showing: EventShowing
}

const itemsForWeek = (
  events: ClubEvent[],
  weekStart: moment.Moment,
): CalendarItem[] => {
  const weekEnd = weekStart.clone().add(7, 'days')
  const items: CalendarItem[] = []
  events.forEach((event) => {
    ;(event.showings || []).forEach((showing) => {
      const start = moment(showing.start_time)
      if (start.isBetween(weekStart, weekEnd, undefined, '[)')) {
        items.push({ event, showing })
      }
    })
    if (!event.showings?.length && event.earliest_start_time) {
      const start = moment(event.earliest_start_time)
      if (start.isBetween(weekStart, weekEnd, undefined, '[)')) {
        items.push({
          event,
          showing: {
            id: -event.id,
            start_time: event.earliest_start_time,
            end_time: event.latest_end_time || event.earliest_start_time,
            location: null,
            ticket_order_limit: 10,
            ticketed: false,
          },
        })
      }
    }
  })
  return items
}

type Props = {
  events: ClubEvent[]
  weekStart: moment.Moment
  onWeekChange: (start: moment.Moment) => void
  onSelectEvent: (event: ClubEvent) => void
}

export default function EventsWeekCalendar({
  events,
  weekStart,
  onWeekChange,
  onSelectEvent,
}: Props): ReactElement<any> {
  const days = Array.from({ length: 7 }, (_, i) =>
    weekStart.clone().add(i, 'days'),
  )
  const items = itemsForWeek(events, weekStart)
  const monthLabel = weekStart.format('MMMM YYYY')

  return (
    <Wrap>
      <MonthBar>
        <NavButton
          type="button"
          aria-label="Previous week"
          onClick={() => onWeekChange(weekStart.clone().subtract(1, 'week'))}
        >
          ‹
        </NavButton>
        <MonthLabel>{monthLabel}</MonthLabel>
        <NavButton
          type="button"
          aria-label="Next week"
          onClick={() => onWeekChange(weekStart.clone().add(1, 'week'))}
        >
          ›
        </NavButton>
      </MonthBar>
      <Grid>
        <DayHeader>
          <div />
          {days.map((day) => (
            <DayCell key={day.format('YYYY-MM-DD')}>
              {day.format('ddd')}
              <span>{day.format('D')}</span>
            </DayCell>
          ))}
        </DayHeader>
        <Body>
          <div>
            {HOURS.map((hour) => (
              <HourGutter key={hour}>
                {moment({ hour }).format('h A')}
              </HourGutter>
            ))}
          </div>
          {days.map((day) => (
            <DayCol key={day.format('YYYY-MM-DD')}>
              {HOURS.map((hour) => (
                <HourRule key={hour} />
              ))}
              {items
                .filter((item) => moment(item.showing.start_time).day() === day.day())
                .map((item) => {
                  const start = moment(item.showing.start_time)
                  const end = moment(item.showing.end_time)
                  const top =
                    (start.hours() + start.minutes() / 60 - HOURS[0]) * ROW_PX
                  const hours = Math.max(
                    end.diff(start, 'minutes') / 60,
                    0.75,
                  )
                  const color =
                    EVENT_TYPE_COLORS[item.event.type] || EVENT_TYPE_COLORS[0]
                  return (
                    <Block
                      key={`${item.event.id}-${item.showing.id}`}
                      type="button"
                      $top={top}
                      $height={hours * ROW_PX}
                      $color={color}
                      onClick={() => onSelectEvent(item.event)}
                    >
                      <Title>{item.event.name || 'Untitled'}</Title>
                      {item.showing.location && (
                        <Meta>{item.showing.location}</Meta>
                      )}
                    </Block>
                  )
                })}
            </DayCol>
          ))}
        </Body>
      </Grid>
    </Wrap>
  )
}
