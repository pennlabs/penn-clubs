import { Icon, Text, StrongText, Card } from '../common'
import { useState, useEffect } from 'react'

const Events = props => {
  const data = props.data

  const iconStyles = {
    float: "left",
    marginRight: "7px"
  }

  const bigStyles = {
    fontSize: "13px",
    fontWeight: "bold"
  }

  const smallStyles = {
    fontSize: "13px"
  }

  if (!data || !data.length) {
    return <></>
  }

  return (
    <Card bordered style={{ marginBottom: '1rem' }}>
      <StrongText>Events</StrongText>
      {data.map((entry, index) => {
        return (
          <div key={index} style={{ marginBottom: '0.5rem' }}>
            <Icon name='calendar' style={iconStyles} size="32px" alt='Calendar icon' />
            <p style={bigStyles}>
              {new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "long",
                day: "2-digit",
                hour: "numeric",
                minute: "numeric"
              }).format(new Date(entry.start_time))} | {entry.location}
            </p>
            <p style={smallStyles}>
              {entry.name}
            </p>
          </div>
        )
      })}
    </Card>
  )
}

export default Events
