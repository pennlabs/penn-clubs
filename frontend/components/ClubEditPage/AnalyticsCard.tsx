import Moment from 'moment'
import Head from 'next/head'
import { ReactElement, useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import {
  ChartLabel,
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
import { Text } from '../common'

type AnalyticsCardProps = {
  club: Club
}

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
  const [max, setMax] = useState(1)

  useEffect(() => {
    doApiRequest(
      `/clubs/${club.code}/analytics?format=json&date=${Moment(date).format(
        'YYYY-MM-DD',
      )}`,
      {},
    )
      .then((request) => request.json())
      .then((response) => {
        setVisits(response.visits)
        setFavorites(response.favorites)
        setSubscriptions(response.subscriptions)
        if (response.max > 1) {
          setMax(response.max)
        }
      })
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
        <Text>
          Analyze the traffic that your club has recieved on a specific date.
        </Text>
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
        <XYPlot
          xType="ordinal"
          yDomain={[0, max]}
          width={800}
          height={350}
          margin={{ bottom: 60 }}
        >
          <XAxis />
          <YAxis />
          <ChartLabel
            text="Time (US/Eastern)"
            includeMargin={true}
            xPercent={0.45}
            yPercent={0.85}
          />
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
