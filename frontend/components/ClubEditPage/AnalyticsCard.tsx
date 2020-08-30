import Moment from 'moment'
import Head from 'next/head'
import { ReactElement, useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import {
  DiscreteColorLegend,
  HorizontalGridLines,
  LineMarkSeries,
  VerticalGridLines,
  XAxis,
  XYPlot,
  YAxis,
} from 'react-vis'
import s from 'styled-components'

import { Club, MembershipRank, MembershipRole } from '../../types'
import { doApiRequest } from '../../utils'
import BaseCard from './BaseCard'

type AnalyticsCardProps = {
  club: Club
}

const DatePickerHeader = s.span`
  position: relative;
  font-size: 1.2em;
  top: 7px;
  margin-right: 10px;
`
const PlotContainer = s.div`
  width: 100%;
  text-align: center;
`

export default function AnalyticsCard({
  club,
}: AnalyticsCardProps): ReactElement {
  const [visits, setVisits] = useState([])
  const [favorites, setFavorites] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [date, setDate] = useState(new Date())

  async function loadData(url) {
    const request = await doApiRequest(url, {})

    const hours = {}
    const response = await request.json()

    for (let i = 0; i < 24; i++) {
      hours[i.toString()] = 0
    }

    for (let i = 0; i < response.length; i++) {
      const hour = response[i].hour
      if (hours[hour] === undefined) {
        hours[hour] = 1
      } else {
        hours[hour]++
      }
    }

    const data = []
    for (const hour in hours) {
      let label = ''
      if (Number(hour) === 0) {
        label = '12am'
      } else if (Number(hour) < 12) {
        label = hour + 'am'
      } else if (Number(hour) === 12) {
        label = '12pm'
      } else {
        label = String(Number(hour) % 12) + 'pm'
      }

      data.push({ x: label, y: hours[hour] })
    }

    return data
  }

  useEffect(() => {
    loadData(
      `/clubs/${club.code}/club_visit?format=json&date=${Moment(date).format(
        'YYYY-MM-DD',
      )}`,
    ).then((data) => setVisits(data))

    loadData(
      `/clubs/${club.code}/favorite?format=json&date=${Moment(date).format(
        'YYYY-MM-DD',
      )}`,
    ).then((data) => setFavorites(data))

    loadData(
      `/clubs/${club.code}/subscription?format=json&date=${Moment(date).format(
        'YYYY-MM-DD',
      )}`,
    ).then((data) => setSubscriptions(data))
  }, [date])

  const legendItems = [
    {
      title: 'Page visits',
      strokeWidth: 6,
    },
    {
      title: 'New favorites',
      strokeWidth: 6,
    },
    {
      title: 'New subscriptions',
      strokeWidth: 6,
    },
  ]

  return (
    <>
      <Head>
        <link
          href="/static/css/style-react-vis.css"
          rel="stylesheet"
          key="editor-css"
        />
        <link
          href="/static/css/react-datepicker.css"
          rel="stylesheet"
          key="datepicker-css"
        />
      </Head>
      <BaseCard title="Analytics">
        <DatePickerHeader>Date:</DatePickerHeader>
        <DatePicker
          className="input"
          format="MM'/'dd'/'y"
          selected={date}
          onChange={(val) => {
            setDate(val)
          }}
        />
        <br></br>
        <br></br>

        <DiscreteColorLegend
          items={legendItems}
          orientation="vertical"
          style={{ display: 'flex' }}
        />
        <XYPlot xType="ordinal" width={800} height={350}>
          <XAxis />
          <YAxis />

          <HorizontalGridLines />
          <VerticalGridLines />
          <LineMarkSeries data={visits} />
          <LineMarkSeries data={favorites} />
          <LineMarkSeries data={subscriptions} />
        </XYPlot>
      </BaseCard>
    </>
  )
}
