import React, { ReactElement, useState } from 'react'
import { Hint, RadialChart } from 'react-vis'
import styled from 'styled-components'

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
      Object.keys(applicationCommittees[club][committee]).forEach((status) => {
        if (!(club in applicationsGrouped)) {
          applicationsGrouped[club] = {}
        }
        if (!(committee in applicationsGrouped[club])) {
          applicationsGrouped[club][committee] = []
        }
        applicationsGrouped[club][committee].push({
          angle: applicationCommittees[club][committee][status],
          label: status,
          color: colors[status],
        })
      })
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

  function downloadData(statuses) {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(statuses, null, 2))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute('href', dataStr)
    downloadAnchorNode.setAttribute('download', 'applicationStatuses.json')
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

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
      <button className="button" onClick={() => downloadData(statuses)}>
        Download Data
      </button>
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
