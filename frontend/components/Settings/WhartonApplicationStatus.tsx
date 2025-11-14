import { json2csv } from 'json-2-csv'
import React, { ReactElement, useEffect, useState } from 'react'
import Select from 'react-select'
import { toast } from 'react-toastify'
import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import styled from 'styled-components'

import { WHITE } from '~/constants/colors'
import { ApplicationStatus } from '~/types'
import { doApiRequest } from '~/utils'

import { FAIR_NAME, OBJECT_NAME_PLURAL } from '../../utils/branding'
import { CardHeader, CardTitle } from '../ClubCard'
import { Card, Loading, Text } from '../common'

type Props = {
  statuses: ApplicationStatus[]
}

type PieDataPoint = {
  value: number
  label: string
  color?: string
  tooltip: string
}
type PieData = PieDataPoint[]
type PieChartData = {
  [key: string]: {
    [key: string]: PieData
  }
}

const colors = {
  Pending: '#F4A549',
  'Rejected after interview(s)': '#8C0900',
  'Rejected after written application': '#FF3224',
  Accepted: '#A9F449',
}

function parseStatuses(statuses: ApplicationStatus[]): PieChartData {
  const applicationsTotal = {}
  const applicationCommittees = {}
  const applicationsGrouped: PieChartData = {}
  statuses.forEach((status) => {
    if (!(status.club in applicationCommittees)) {
      const total = {}
      Object.keys(colors).forEach((status) => (total[status] = 0))
      applicationsTotal[status.club] = total

      applicationCommittees[status.club] = {}
    }
    if (!(status.committee in applicationCommittees[status.club])) {
      applicationCommittees[status.club][status.committee] = {}
    }
    if (
      !(status.status in applicationCommittees[status.club][status.committee])
    ) {
      applicationCommittees[status.club][status.committee][status.status] = 0
    }
    applicationsTotal[status.club][status.status] += status.count
    applicationCommittees[status.club][status.committee][status.status] +=
      status.count
  })

  Object.keys(applicationCommittees).forEach((club) => {
    Object.keys(applicationCommittees[club]).forEach((committee) => {
      const obj = applicationCommittees[club][committee]
      const total: number = (Object.values(obj) as number[]).reduce(
        (acc: number, curr: number) => acc + curr,
        0,
      )

      Object.keys(applicationCommittees[club][committee]).forEach((status) => {
        if (!(club in applicationsGrouped)) {
          applicationsGrouped[club] = {}
        }
        if (!(committee in applicationsGrouped[club])) {
          applicationsGrouped[club][committee] = []
        }
        const val = applicationCommittees[club][committee][status]
        applicationsGrouped[club][committee].push({
          value: val,
          label: status,
          color: colors[status],
          tooltip: `\n count: ${val} \n percent: ${((val / total) * 100).toFixed(2)}%`,
        })
      })
    })
  })

  Object.keys(applicationsTotal).forEach((application) => {
    if (!(application in applicationsGrouped)) {
      return
    }
    applicationsGrouped[application].Total = []
    const obj = applicationsTotal[application]

    const total: number = (Object.values(obj) as number[]).reduce(
      (acc: number, curr: number) => acc + curr,
      0,
    )
    Object.keys(applicationsTotal[application]).forEach((status) =>
      applicationsGrouped[application].Total.push({
        value: applicationsTotal[application][status],
        label: status,
        color: colors[status],
        tooltip: `\n count: ${applicationsTotal[application][status]} \n percent: ${((applicationsTotal[application][status] / total) * 100).toFixed(2)}%`,
      }),
    )
  })

  return applicationsGrouped
}

const LegendContainer = styled.div`
  height: 130px;
  display: grid;
  rowGap: "0.5rem",
  alignItems: "center"
`

const LegendColor = styled.div<{ color: string }>`
  background-color: ${(props) => props.color};
`
const LegendRow = styled.div`
  display: grid;
  grid-template-columns: 20px auto;
  gap: 6px;
`

interface LegendProps {
  items: {
    color: string
    title: string
  }[]
}
const Legend: React.FC<LegendProps> = ({ items }) => {
  return (
    <LegendContainer>
      {items.map((item, index) => (
        <LegendRow>
          <LegendColor key={index} color={item.color} />
          <div style={{ alignSelf: 'center' }}>{item.title}</div>
        </LegendRow>
      ))}
    </LegendContainer>
  )
}

function StatusCard({
  application,
  pieData,
}: {
  application: string
  pieData: PieChartData
}) {
  const [currentCommittee, setCurrentCommittee] = useState<string | null>(null)
  const [value, setValue] = useState<PieDataPoint | null>(null)

  return (
    <>
      <Card className="mb-4" $bordered $background={WHITE}>
        <CardHeader>
          <CardTitle className="is-size-3">{application}</CardTitle>
        </CardHeader>
        <br></br>
        <div
          style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}
        >
          {Object.keys(pieData[application])
            .sort((left, right) =>
              left === 'Total'
                ? -10
                : right === 'Total'
                  ? -10
                  : left.localeCompare(right),
            )
            .map((committee) => (
              <div
                style={{
                  display: 'block',
                  width: '200px',
                  textAlign: 'center',
                  position: 'relative',
                  fontSize: '10pt',
                }}
                key={committee}
              >
                <CardTitle className="is-size-5">
                  {committee === 'null' ? 'General Member' : committee}
                </CardTitle>
                <PieChart width={200} height={200}>
                  <Pie
                    data={pieData[application][committee]}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius="95%"
                    labelLine={false}
                  >
                    {pieData[application][committee].map((d, ind) => (
                      <Cell key={ind} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, { payload }) => (
                      <span style={{ whiteSpace: 'pre-line' }}>
                        {payload.tooltip}
                      </span>
                    )}
                    wrapperStyle={{
                      zIndex: 9999,
                    }}
                  />
                </PieChart>
              </div>
            ))}
        </div>
      </Card>
    </>
  )
}

const WhartonApplicationStatus = ({
  statuses: initialStatuses,
}: Props): ReactElement<any> => {
  const [statuses, setStatuses] = useState<
    ApplicationStatus[] | { detail: string } | null
  >(initialStatuses ?? null)
  const [selectedCycle, setSelectedCycle] = useState<{
    value: number | null
    label: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Extract unique cycles from statuses
  const cycleOptions = React.useMemo(() => {
    if (!statuses || 'detail' in statuses) return []

    const cycles = new Map<number | null, string>()
    statuses.forEach((status) => {
      if (status.cycle_id !== null && status.cycle_name !== null) {
        cycles.set(status.cycle_id, status.cycle_name)
      }
    })

    const options = [
      { value: null, label: 'All Cycles' },
      ...Array.from(cycles.entries())
        .map(([id, name]) => ({ value: id, label: name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ]

    return options
  }, [initialStatuses])

  useEffect(() => {
    if (selectedCycle === null) {
      // Default to "All Cycles"
      setSelectedCycle({ value: null, label: 'All Cycles' })
      return
    }

    setIsLoading(true)
    const url =
      selectedCycle.value === null
        ? '/whartonapplications/status/?format=json'
        : `/whartonapplications/status/?format=json&cycle=${selectedCycle.value}`

    doApiRequest(url)
      .then((resp) => resp.json())
      .then((data) => {
        setStatuses(data)
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })
  }, [selectedCycle])

  function downloadData(statuses: ApplicationStatus[]) {
    try {
      const csv = json2csv(statuses, { emptyFieldValue: '' })
      const dataStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
      const downloadAnchorNode = document.createElement('a')
      downloadAnchorNode.setAttribute('href', dataStr)
      downloadAnchorNode.setAttribute('download', 'applicationStatuses.csv')
      document.body.appendChild(downloadAnchorNode)
      downloadAnchorNode.click()
      downloadAnchorNode.remove()
    } catch (error) {
      toast.error('Failed to download CSV. Please try again.')
    }
  }

  if (statuses == null || isLoading) {
    return <Loading />
  }

  if (statuses != null && 'detail' in statuses) {
    return <Text>{statuses.detail}</Text>
  }

  const pieChartData = parseStatuses(statuses)

  return (
    <>
      <Text>
        This is a dashboard where you can view the status and events for all
        registered {OBJECT_NAME_PLURAL} for an {FAIR_NAME} fair. Only users with
        the required permissions can view this page.
      </Text>
      <div className="columns">
        <div className="column is-4">
          <label className="label">Filter by Application Cycle</label>
          <Select
            options={cycleOptions}
            value={selectedCycle}
            onChange={(option) => setSelectedCycle(option)}
            placeholder="Select cycle..."
          />
        </div>
        <div className="column">
          <label className="label" style={{ visibility: 'hidden' }}>
            Actions
          </label>
          <button
            className="button"
            onClick={() => downloadData(statuses)}
            title="Downloads data for the currently selected cycle filter"
          >
            Download Filtered Data
          </button>
        </div>
      </div>
      <div className="column">
        <Legend
          items={Object.keys(colors).map((label) => ({
            title: label,
            color: colors[label],
          }))}
        />
      </div>
      {Object.keys(pieChartData).map((application, key) => (
        <StatusCard
          key={key}
          application={application}
          pieData={pieChartData}
        ></StatusCard>
      ))}
    </>
  )
}

export default WhartonApplicationStatus
