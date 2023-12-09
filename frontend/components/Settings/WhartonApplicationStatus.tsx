import React, { ReactElement, useState } from 'react'
import { DiscreteColorLegend, Hint, RadialChart } from 'react-vis'

import { WHITE } from '~/constants/colors'
import { ApplicationStatus } from '~/types'

import { FAIR_NAME, OBJECT_NAME_PLURAL } from '../../utils/branding'
import { CardHeader, CardTitle } from '../ClubCard'
import { Card, Loading, Text } from '../common'

type Props = {
  statuses: ApplicationStatus[]
}

type PieDataPoint = { angle: number; label: string; color?: string }
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
  const applicationsGrouped: PieChartData = {}
  statuses.forEach((status) => {
    if (!(status.name in applicationsGrouped)) {
      const total = {}
      Object.keys(colors).forEach((status) => (total[status] = 0))
      applicationsTotal[status.name] = total

      const grouped = {}
      grouped[status.committee] = []
      applicationsGrouped[status.name] = grouped
    } else if (!(status.committee in applicationsGrouped[status.name])) {
      applicationsGrouped[status.name][status.committee] = []
    }
    applicationsTotal[status.name][status.status] += status.count
    applicationsGrouped[status.name][status.committee].push({
      angle: status.count,
      label: status.status,
      color: colors[status.status],
    })
  })

  Object.keys(applicationsTotal).forEach((application) => {
    if (!(application in applicationsGrouped)) {
      return
    }
    applicationsGrouped[application].Total = []
    Object.keys(applicationsTotal[application]).forEach((status) =>
      applicationsGrouped[application].Total.push({
        angle: applicationsTotal[application][status],
        label: status,
        color: colors[status],
      }),
    )
  })

  return applicationsGrouped
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

  function count(committee: string, label: string): number {
    return (
      pieData[application][committee].find((data) => data.label === label)
        ?.angle ?? 0
    )
  }

  function percentage(committee: string, label: string): number {
    const total = pieData[application][committee].reduce(
      (acc, x) => acc + x.angle,
      0,
    )
    const count =
      pieData[application][committee].find((data) => data.label === label)
        ?.angle ?? 0
    return count !== 0 ? Math.round((count / total) * 10000) / 100 : 0
  }

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
              >
                <CardTitle className="is-size-5">
                  {committee === 'null' ? 'General Member' : committee}
                </CardTitle>
                <RadialChart
                  data={pieData[application][committee]}
                  width={200}
                  height={200}
                  radius={80}
                  colorType="literal"
                  labelsAboveChildren={true}
                  onValueMouseOver={(v: PieDataPoint) => {
                    setValue(v)
                    setCurrentCommittee(committee)
                  }}
                >
                  {value != null && committee === currentCommittee && (
                    <Hint value={value}>
                      <div
                        style={{
                          backgroundColor: 'black',
                          color: 'white',
                          padding: '5px',
                          borderRadius: '10px',
                        }}
                      >
                        <p>{value.label}</p>
                        <p>count: {count(committee, value.label)}</p>
                        <p>percent: {percentage(committee, value.label)}%</p>
                      </div>
                    </Hint>
                  )}
                </RadialChart>
              </div>
            ))}
        </div>
      </Card>
    </>
  )
}

const WhartonApplicationStatus = ({
  statuses: initialStatuses,
}: Props): ReactElement => {
  const [statuses, _] = useState<
    ApplicationStatus[] | { detail: string } | null
  >(initialStatuses ?? null)

  if (statuses == null) {
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
      <div className="column">
        <DiscreteColorLegend
          items={Object.keys(colors).map((label) => ({
            title: label,
            strokeWidth: 100,
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
