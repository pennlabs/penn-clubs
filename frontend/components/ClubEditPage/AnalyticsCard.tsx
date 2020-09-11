import moment from 'moment'
import Head from 'next/head'
import { ReactElement, useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import {
  ChartLabel,
  DiscreteColorLegend,
  HorizontalGridLines,
  LineMarkSeries,
  makeWidthFlexible,
  RadialChart,
  VerticalGridLines,
  XAxis,
  XYPlot,
  YAxis,
} from 'react-vis'

import { Club } from '../../types'
import { doApiRequest, titleize } from '../../utils'
import { Loading, Text } from '../common'
import BaseCard from './BaseCard'

type AnalyticsCardProps = {
  club: Club
}

type PieChartData = {
  [key: string]: {
    title: string
    content: {
      person__profile__graduation_year: number | null
      count: number
    }[]
  }
}

type LineData = { x: Date; y: number }[]
type PieData = { angle: number; label: string }[]

const FlexibleXYPlot = makeWidthFlexible(XYPlot)

function parse(
  obj,
  startRange: Date,
  endRange: Date,
  interval: number,
): LineData {
  const exists = {}
  obj.forEach((item) => {
    exists[new Date(item.hour).getTime()] = item.count
  })
  const output: LineData = []
  for (let i = startRange.getTime(); i <= endRange.getTime(); i += interval) {
    output.push({ x: new Date(i), y: exists[i] ?? 0 })
  }
  return output
}

function parsePie(obj): PieData {
  const output: PieData = []
  obj.forEach((item) => {
    output.push({
      angle: item.count,
      label: item.person__profile__graduation_year ?? 'None',
    })
  })
  return output
}

export default function AnalyticsCard({
  club,
}: AnalyticsCardProps): ReactElement {
  const [visits, setVisits] = useState<LineData>([])
  const [favorites, setFavorites] = useState<LineData>([])
  const [subscriptions, setSubscriptions] = useState<LineData>([])
  const [date, setDate] = useState<Date>(() => {
    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)
    return startDate
  })
  const [endRange, setEndRange] = useState<Date>(() => {
    const endDate = new Date()
    endDate.setHours(0, 0, 0, 0)
    return endDate
  })
  const [max, setMax] = useState<number>(1)
  const [isLoading, setLoading] = useState<boolean>(false)
  const [pieChartData, setPieChartData] = useState<PieChartData | null>(null)

  const endDate = new Date(endRange.getTime() + 24 * 60 * 60 * 1000)
  const interval = 60 * 60 * 1000

  useEffect(() => {
    setLoading(true)
    doApiRequest(
      `/clubs/${club.code}/analytics?format=json&start=${moment(
        date,
      ).toISOString()}&end=${moment(endDate).toISOString()}`,
    )
      .then((request) => request.json())
      .then((response) => {
        setVisits(parse(response.visits, date, endDate, interval))
        setFavorites(parse(response.favorites, date, endDate, interval))
        setSubscriptions(parse(response.subscriptions, date, endDate, interval))
        if (response.max > 1) {
          setMax(response.max)
        }
        setLoading(false)
      })
  }, [date, endRange])

  useEffect(() => {
    doApiRequest(`/clubs/${club.code}/analytics_pie_charts/?format=json`)
      .then((resp) => resp.json())
      .then((resp) => {
        setPieChartData(resp)
      })
  }, [])

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
      <BaseCard title="Time Series Analytics">
        <Text>
          Analyze the traffic that your club has recieved on a specific date
          range. Displays data between the start of the first day and the end of
          the last day.
        </Text>
        <div className="is-clearfix">
          <div className="is-pulled-left mr-3">
            <small>Start Range</small>
            <br />
            <DatePicker
              className="input"
              format="MM'/'dd'/'y"
              selected={date}
              onChange={(val) => {
                setDate(val)
              }}
            />
          </div>
          <div className="is-pulled-left">
            <small>End Range</small>
            <br />
            <DatePicker
              className="input"
              format="MM'/'dd'/'y"
              selected={endRange}
              onChange={(val) => {
                setEndRange(val)
              }}
            />
          </div>
        </div>
        <br></br>
        <br></br>
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <DiscreteColorLegend
              items={legendItems}
              orientation="vertical"
              style={{ display: 'flex' }}
            />
            <FlexibleXYPlot
              xType="time"
              xDomain={[date, endDate]}
              yDomain={[0, max]}
              height={350}
              margin={{ bottom: 60 }}
            >
              <XAxis tickFormat={(date) => moment(date).format('H')} />
              <YAxis />
              <ChartLabel
                text="Time (Hour)"
                includeMargin={true}
                xPercent={0.5}
                yPercent={0.85}
              />
              <HorizontalGridLines />
              <VerticalGridLines />
              <LineMarkSeries data={visits} />
              <LineMarkSeries data={favorites} />
              <LineMarkSeries data={subscriptions} />
            </FlexibleXYPlot>
          </>
        )}
      </BaseCard>
      <BaseCard title="Pie Chart Analytics">
        <Text>
          Show demographic information about people who have bookmarked,
          subscribed, or visited the club.
        </Text>
        {pieChartData == null ? (
          <Loading />
        ) : (
          <div className="is-clearfix">
            {Object.entries(pieChartData).map(([key, value]) => {
              const pieData = parsePie(value.content)
              return (
                <div key={key} className="is-pulled-left mr-3 mb-3">
                  <b>{value.title}</b>
                  <br />
                  <RadialChart data={pieData} width={300} height={300}>
                    <DiscreteColorLegend
                      items={pieData.map((item) => ({
                        title: item.label,
                        strokeWidth: 6,
                      }))}
                    />
                  </RadialChart>
                </div>
              )
            })}
          </div>
        )}
      </BaseCard>
    </>
  )
}
