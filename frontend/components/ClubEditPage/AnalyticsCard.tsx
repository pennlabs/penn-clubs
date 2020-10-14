import Color from 'color'
import moment from 'moment'
import Head from 'next/head'
import { ReactElement, useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import Select from 'react-select'
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

import { CLUBS_BLUE } from '../../constants'
import { Club } from '../../types'
import { doApiRequest } from '../../utils'
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
type PieData = { angle: number; label: string; color?: string }[]

const FlexibleXYPlot = makeWidthFlexible(XYPlot)

enum Metric {
  Bookmark = 'favorite',
  Subscription = 'subscribe',
  Visit = 'visit',
}

enum Category {
  School = 'school',
  Graduation_Year = 'graduation_year',
}

const METRICS = [
  {
    value: Metric.Bookmark,
    label: 'Bookmarks',
  },
  {
    value: Metric.Subscription,
    label: 'Subscriptions',
  },
  {
    value: Metric.Visit,
    label: 'Visits',
  },
]

const CATEGORIES = [
  {
    value: Category.School,
    label: 'School',
  },
  {
    value: Category.Graduation_Year,
    label: 'Graduation Year',
  },
]

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
  let color = Color(CLUBS_BLUE)
  const output: PieData = []
  obj.forEach((item) => {
    const label =
      ((Object.entries(item).find((key) => key[0].startsWith('person')) ?? [
        'None',
        'None',
      ])[1] as string) ?? 'None'

    output.push({
      angle: item.count,
      label,
      color: color.rgb().string(),
    })
    color = color.rotate(360 / obj.length)
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
  const [metric, setMetric] = useState(METRICS[0])
  const [category, setCategory] = useState(CATEGORIES[0])

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
            <label>Start Range</label>
            <br />
            <DatePicker
              className="input"
              format="MM'/'dd'/'y"
              selected={date}
              onChange={setDate}
            />
          </div>
          <div className="is-pulled-left">
            <label>End Range</label>
            <br />
            <DatePicker
              className="input"
              format="MM'/'dd'/'y"
              selected={endRange}
              onChange={setEndRange}
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
              <LineMarkSeries size={1} data={visits} />
              <LineMarkSeries size={1} data={favorites} />
              <LineMarkSeries size={1} data={subscriptions} />
            </FlexibleXYPlot>
          </>
        )}
      </BaseCard>
      <BaseCard title="Pie Chart Analytics">
        <Text>
          Show demographic information about people who have bookmarked,
          subscribed, or visited the club. Students with multiple schools are
          counted twice for applicable graphs.
        </Text>
        <div className="columns">
          <div className="column">
            <label>Category</label>
            <br />
            <Select
              options={CATEGORIES}
              value={category}
              onChange={(val) => {
                return setCategory(val)
              }}
            />
          </div>
          <div className="column">
            <label>Metric</label>
            <br />
            <Select options={METRICS} value={metric} onChange={setMetric} />
          </div>
        </div>
        <br></br>
        <br></br>
        {pieChartData == null ? (
          <Loading />
        ) : (
          <>
            <div className="is-clearfix">
              <div className="columns">
                <div className="column">
                  <b>{pieChartData[category.value][metric.value].title}</b>
                  <DiscreteColorLegend
                    items={parsePie(
                      pieChartData[category.value][metric.value].content,
                    ).map((item) => ({
                      title: `${item.label} (${item.angle})`,
                      strokeWidth: 6,
                      color: item.color,
                    }))}
                  />
                </div>
                <div className="column is-8">
                  <RadialChart
                    data={parsePie(
                      pieChartData[category.value][metric.value].content,
                    )}
                    width={400}
                    height={400}
                    colorType="literal"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </BaseCard>
    </>
  )
}
