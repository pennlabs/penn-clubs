import moment from 'moment'
import { ReactElement, useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import Select from 'react-select'
import {
  Cell,
  Label,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import { Club } from '../../types'
import { doApiRequest } from '../../utils'
import { OBJECT_NAME_SINGULAR } from '../../utils/branding'
import { Loading, Text } from '../common'
import BaseCard from './BaseCard'

type AnalyticsCardProps = {
  club: Club
}

type PieChartData = {
  content: {
    person__profile__graduation_year: number | null
    count: number
  }[]
}

type LineData = { x: Date; y: number }[]
type PieData = { angle: number; label: string; color?: string }[]

enum Metric {
  Bookmark = 'favorite',
  Subscription = 'subscribe',
  Visit = 'visit',
}

enum Category {
  School = 'school',
  GraduationYear = 'graduation_year',
}

enum Group {
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
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
    value: Category.GraduationYear,
    label: 'Graduation Year',
  },
]

const GROUPS = [
  {
    value: Group.Hour,
    label: 'Hour',
  },
  {
    value: Group.Day,
    label: 'Day',
  },
  {
    value: Group.Week,
    label: 'Week',
  },
  {
    value: Group.Month,
    label: 'Month',
  },
]

function parse(obj, startRange: Date, endRange: Date, group: Group): LineData {
  const exists = {}
  obj.forEach((item) => {
    const adjustedDate = new Date(item.group).toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
    })
    exists[new Date(adjustedDate).getTime()] = item.count
  })
  const output: LineData = []
  let current = startRange
  // If we are grouping by week or month, we need to make sure our start
  // day is the same as the start day on the backend, so we do this
  // logic to ensure they line up
  if (group === Group.Day) {
    const currentAdjusted = current.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
    })
    current = new Date(new Date(currentAdjusted).toDateString())
  } else if (group === Group.Week) {
    current = new Date(
      current.setDate(current.getDate() - current.getDay() + 1),
    )
  } else if (group === Group.Month) {
    current = new Date(current.getFullYear(), current.getMonth(), 1)
  }
  for (let i = current.getTime(); i <= endRange.getTime(); ) {
    current = new Date(i)
    output.push({ x: current, y: exists[i] ?? 0 })

    // Increment by the groupBy interval
    if (group === Group.Hour) {
      i += 60 * 60 * 1000
    } else if (group === Group.Day) {
      i += 24 * 60 * 60 * 1000
    } else if (group === Group.Week) {
      i += 7 * 24 * 60 * 60 * 1000
    } else if (group === Group.Month) {
      // There is not a standardized interval between months
      current = new Date(current.setMonth(current.getMonth() + 1))
      i = current.getTime()
    }
  }
  return output
}

function parsePie(obj): PieData {
  const colors = ['#E24A5E', '#4954F4', '#9E49F4', '#F4A549', '#A9F449']
  let colorIndex = 0

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
      color: colors[colorIndex++],
    })
  })
  return output
}

export default function AnalyticsCard({
  club,
}: AnalyticsCardProps): ReactElement<any> {
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
  const [group, setGroup] = useState(GROUPS[0])

  const endDate = new Date(endRange.getTime() + 24 * 60 * 60 * 1000)

  const chooseGroup = () => {
    const interval = moment(endDate).diff(moment(date), 'days')
    if (interval <= 1) {
      return [GROUPS[0]] // Hour
    } else if (interval <= 7) {
      return [GROUPS[1]] // Day
    } else if (interval <= 31) {
      return [GROUPS[1], GROUPS[2]] // Day, Week
    }
    return [GROUPS[2], GROUPS[3]] // Week, Month
  }

  useEffect(() => {
    setLoading(true)
    doApiRequest(
      `/clubs/${club.code}/analytics?format=json&start=${moment(
        date,
      ).toISOString()}&end=${moment(endDate).toISOString()}&group=${
        group.value
      }`,
    )
      .then((request) => request.json())
      .then((response) => {
        setVisits(parse(response.visits, date, endDate, group.value))
        setFavorites(parse(response.favorites, date, endDate, group.value))
        setSubscriptions(
          parse(response.subscriptions, date, endDate, group.value),
        )
        if (response.max > 1) {
          setMax(response.max)
        }
        setLoading(false)
      })
  }, [date, endRange, group])

  useEffect(() => {
    doApiRequest(
      `/clubs/${club.code}/analytics_pie_charts/?format=json&category=${category.value}&metric=${metric.value}`,
    )
      .then((resp) => resp.json())
      .then((resp) => {
        setPieChartData(resp)
      })
  }, [metric, category])

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

  const toTicks = (date: number) => {
    if (group.value === Group.Hour) {
      return moment(date).format('H')
    } else if (group.value === Group.Day) {
      return moment(date).format('D')
    } else if (group.value === Group.Week) {
      // We need to round down for Week values
      return moment(date).add(-1, 'weeks').format('MM/DD')
    } else if (group.value === Group.Month) {
      // We need to round down for Month values
      return moment(date).add(-1, 'months').format('MM/DD')
    }
    return moment(date).format('MM/DD')
  }

  return (
    <>
      <BaseCard title="Time Series Analytics">
        <Text>
          Analyze the traffic that your {OBJECT_NAME_SINGULAR} has received on a
          specific date range. Displays data between the start of the first day
          and the end of the last day.
        </Text>
        <div className="is-clearfix">
          <div className="columns">
            <div className="column is-2">
              <label>Start Range</label>
              <br />
              <DatePicker
                className="input"
                format="MM'/'dd'/'y"
                selected={date}
                onChange={setDate}
              />
            </div>
            <div className="column is-2">
              <label>End Range</label>
              <br />
              <DatePicker
                className="input"
                format="MM'/'dd'/'y"
                selected={endRange}
                onChange={setEndRange}
              />
            </div>
            <div className="column is-8">
              <label>Group By</label>
              <br />
              <Select
                options={chooseGroup()}
                value={group}
                onChange={(v) => v != null && setGroup(v)}
              />
            </div>
          </div>
        </div>
        <br></br>
        <br></br>
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart margin={{ bottom: 60, left: 10, right: 10, top: 10 }}>
                <XAxis
                  dataKey="x"
                  type="number"
                  scale="time"
                  domain={[toTicks(date.getTime()), toTicks(endDate.getTime())]}
                  tickFormatter={toTicks}
                ></XAxis>
                <Label
                  value={`Time (${group.label})`}
                  position="insideBottom"
                  offset={-40}
                />
                <YAxis domain={[0, max]} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                />
                <Line
                  name="Visits"
                  data={visits}
                  dataKey="y"
                  isAnimationActive={false}
                  stroke="red"
                />
                <Line
                  name="Favorites"
                  data={favorites}
                  dataKey="y"
                  isAnimationActive={false}
                  stroke="green"
                />
                <Line
                  name="Subscriptions"
                  data={subscriptions}
                  dataKey="y"
                  isAnimationActive={false}
                  stroke="blue"
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </BaseCard>
      <BaseCard title="Pie Chart Analytics">
        <Text>
          Show demographic information about people who have bookmarked,
          subscribed, or visited the {OBJECT_NAME_SINGULAR}. Students with
          multiple schools are counted twice for applicable graphs.
        </Text>
        <div className="columns">
          <div className="column">
            <label>Category</label>
            <br />
            <Select
              options={CATEGORIES}
              value={category}
              onChange={(v) => v != null && setCategory(v)}
            />
          </div>
          <div className="column">
            <label>Metric</label>
            <br />
            <Select
              options={METRICS}
              value={metric}
              onChange={(v) => v != null && setMetric(v)}
            />
          </div>
        </div>
        <br></br>
        <br></br>
        {pieChartData == null ? (
          <Loading />
        ) : pieChartData.content.length === 0 ? (
          <div>No data to display </div>
        ) : (
          <>
            <div className="is-clearfix">
              <div className="columns">
                <div className="column">
                  <b>
                    {category.label} by {metric.label}
                  </b>

                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={parsePie(pieChartData.content)}
                        dataKey="angle"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={160}
                        labelLine={false}
                      >
                        {parsePie(pieChartData.content).map((d) => (
                          <Cell key={d.label} fill={d.color} />
                        ))}
                      </Pie>
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </BaseCard>
    </>
  )
}
