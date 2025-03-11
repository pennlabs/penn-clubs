// Sunday, Sept 12 | 8:00-9:00 EDT
import moment from 'moment'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { CLUBS_GREY } from '../../constants'

const dateIntervalString = (startDate: Date, endDate: Date): string => {
  const [start, end] = [startDate, endDate].map((d) => moment(d))

  if (![start, end].every((d) => d.isValid())) {
    return 'Invalid date range'
  }
  const [startDateString, endDateString] = [start, end].map((d) => {
    const dateDifference: number = moment(start)
      .startOf('day')
      .diff(moment().startOf('day'), 'days')
    if (dateDifference === 0) return 'Today'
    if (dateDifference === 1) return 'Tomorrow'
    return d.format('dddd, MMM D')
  })
  if (startDateString !== endDateString) {
    return `${startDateString} - ${endDateString}`
  }

  let timeIntervalStrings: string[]
  if ((start.hour() - 12) * (end.hour() - 12) < 0) {
    timeIntervalStrings = [start, end].map((d) => d.format('h:mm A'))
  } else {
    timeIntervalStrings = [start.format('h:mm'), end.format('h:mm A')]
  }
  return `${startDateString} | ${timeIntervalStrings[0]}-${timeIntervalStrings[1]}`
}

const DateInterval = ({
  start,
  end,
  className,
}: {
  start: Date
  end: Date
  className?: string
}): ReactElement<any> => (
  <p className={className} suppressHydrationWarning>
    {dateIntervalString(start, end)}{' '}
  </p>
)

export default styled(DateInterval)`
  color: ${CLUBS_GREY};
  font-size: 14px;
`
