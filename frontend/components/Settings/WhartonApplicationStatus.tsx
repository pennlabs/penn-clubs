import React, { ReactElement, useState } from 'react'
import { DiscreteColorLegend, RadialChart } from 'react-vis'

import { WHITE } from '~/constants/colors'
import { ApplicationStatus } from '~/types'

import { FAIR_NAME, OBJECT_NAME_PLURAL } from '../../utils/branding'
import { CardHeader, CardTitle } from '../ClubCard'
import { Card, Loading, Text } from '../common'

type Props = {
  statuses: ApplicationStatus[]
}

type PieData = { angle: number; label: string; color?: string }[]
type PieChartData = {
  [key: number]: {
    [key: string]: PieData
  }
}

const colors = {
  Pending: '#F4A549',
  'First Round': '#4954F4',
  'Second Round': '#9E49F4',
  Accepted: '#A9F449',
  Rejected: '#E24A5E',
}

function parseStatuses(statuses: ApplicationStatus[]): PieChartData {
  const applicationsGrouped: PieChartData = {}
  statuses.forEach((status) => {
    if (!(status.application in applicationsGrouped)) {
      const obj = {}
      obj[status.committee] = []
      applicationsGrouped[status.application] = obj
    } else if (!(status.committee in applicationsGrouped[status.application])) {
      applicationsGrouped[status.application][status.committee] = []
    }

    applicationsGrouped[status.application][status.committee].push({
      angle: status.count,
      label: status.status,
      color: colors[status.status],
    })
  })
  return applicationsGrouped
}

function StatusCard({
  status,
  pieData,
}: {
  status: ApplicationStatus
  pieData: PieChartData
}) {
  if (!(status.application in pieData)) {
    return null
  }

  return (
    <>
      <Card className="mb-4" bordered hoverable background={WHITE}>
        <CardHeader>
          <CardTitle className="is-size-5">{status.name}</CardTitle>
        </CardHeader>
        {Object.keys(pieData[status.application]).map((committee) => (
          <div className="is-clearfix">
            <div className="columns">
              <div className="column is-8">
                <CardTitle className="is-size-5">{status.committee}</CardTitle>
                <RadialChart
                  data={pieData[status.application][committee]}
                  width={400}
                  height={400}
                  colorType="literal"
                />
              </div>
            </div>
          </div>
        ))}
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
      {statuses.map((status) => (
        <StatusCard status={status} pieData={pieChartData}></StatusCard>
      ))}
    </>
  )
}

export default WhartonApplicationStatus
