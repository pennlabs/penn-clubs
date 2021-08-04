import React, { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

import {
  ALLBIRDS_GRAY,
  ANIMATION_DURATION,
  BORDER_RADIUS,
  CLUBS_BLUE,
  HOVER_GRAY,
  MD,
  mediaMaxWidth,
  SM,
  SNOW,
  WHITE,
} from '~/constants'
import { doApiRequest } from '~/utils'

import { Icon } from '../common/Icon'
import Table from '../common/Table'
import Toggle from '../Settings/Toggle'
import moment from 'moment-timezone'

const StyledResponses = styled.div`
  margin-bottom: 40px;
`

const FormsCard = styled.div<CardProps>`
  padding: 0px;
  box-shadow: 0 0 0 transparent;
  transition: all ${ANIMATION_DURATION}ms ease;
  border-radius: ${BORDER_RADIUS};
  box-shadow: 0 0 0 ${WHITE};
  background-color: ${({ hovering }) => (hovering ? HOVER_GRAY : WHITE)};
  border: 1px solid ${ALLBIRDS_GRAY};
  justify-content: space-between;
  height: 65vh;

  ${mediaMaxWidth(SM)} {
    width: calc(100%);
    padding: 8px;
  }
`

const FormsCardWrapper = styled.div`
  position: relative;
  margin-top: 40px;
  ${mediaMaxWidth(SM)} {
    padding-top: 0;
    padding-bottom: 1rem;
  }
`

const StyledHeader = styled.div.attrs({ className: 'is-clearfix' })`
  margin-bottom: 20px;
  color: ${CLUBS_BLUE};
  font-size: 18px;
  & > .info {
    float: left;
  }
  .tools {
    float: right;
    margin: 0;
    margin-left: auto;
    & > div {
      margin-left: 20px;
      display: inline-block;
    }
  }

  ${mediaMaxWidth(MD)} {
    .tools {
      margin-top: 20px;
    }
  }
`

const FormWrapper = styled.div`
  border-bottom: 1px solid ${ALLBIRDS_GRAY};
  height: 50px;
  padding: 12px;
  cursor: pointer;

  &:hover,
  &:active,
  &:focus {
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
    background-color: ${SNOW};
  }
`

const GeneralSettings = () => {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'row', width: '100' }}>
        <span>Collect Email Addresses</span>
        <div style={{ marginLeft: 'auto' }}>
          <Toggle club={null} active={true} toggle={() => {}} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', width: '100' }}>
        <span>Allow edit after submissions</span>
        <div style={{ marginLeft: 'auto' }}>
          <Toggle club={null} active={true} toggle={() => {}} />
        </div>
      </div>
    </div>
  )
}

const SharingSettings = () => {
  return <div>Sharing</div>
}

const AdvancedSettings = () => {
  return <div>Advanced</div>
}

const tabs = [
  {
    name: 'General',
    content: <GeneralSettings />,
  },
  { name: 'Sharing', content: <SharingSettings /> },
  { name: 'Advanced', content: <AdvancedSettings /> },
]

const Form = (props: any) => {
  const { application, setApplication } = props
  return (
    <FormWrapper onClick={() => setApplication(application)}>
      {application.name}
      <span className="is-pulled-right">
        <Icon
          name="user"
          alt="members"
          size="1.2rem"
          style={{ marginRight: '8px' }}
        />
        {/* TODO: implement applicants number <span style={{ marginRight: '20px' }}>{application.applicantsNumber}</span> */}
        <Icon name="chevron-right" />
      </span>
    </FormWrapper>
  )
}

const forms = []

type Application = {
  id: number
  name: string
}

type Submission = {
  application: number
  committee: string | null
  created_at: string
}

const ApplicationsPage = ({ club }: { club: Club }) => {
  const responseTableFields = [
    { label: 'Committee', name: 'committee' },
    { label: 'Submitted', name: 'created_at' },
    // {
    //   label: 'Status',
    //   name: 'status',
    //   render: (_, index) => (
    //     <span
    //       className={`tag is-${
    //         responses[index].status === 'rejected'
    //           ? 'danger'
    //           : responses[index].status === 'accepted'
    //           ? 'success'
    //           : 'info'
    //       }  is-light`}
    //     >
    //       {responses[index].status}
    //     </span>
    //   ),
    // },
    // { label: 'Submitted', name: 'submitted' },
    // { label: 'Actions', name: 'actions' },
  ]

  const [applications, setApplications] = useState<Array<Application>>([])
  const [
    currentApplication,
    setCurrentApplication,
  ] = useState<Application | null>(null)
  const [responses, setResponses] = useState<Array<Submission>>([])

  useEffect(async () => {
    const applications = await doApiRequest(
      `/clubs/${club.code}/applications/?format=json`,
      {
        method: 'GET',
      },
    ).then((resp) => resp.json())
    if (applications.length !== 0) {
      setApplications(applications)
      setCurrentApplication(applications[0])
    }
  }, [])

  useEffect(async () => {
    if (currentApplication !== null) {
      const responses = (await doApiRequest(
        `/clubs/${club.code}/applications/${currentApplication.id}/submissions/?format=json`,
        {
          method: 'GET',
        },
      ).then((resp) => resp.json())).map((response) => {
        return {
          ...response,
          committee: response.committee?.name ?? "N/A",
          created_at: moment(response.created_at).tz('America/New_York').format('LLL')
        }
      })
      setResponses(responses)
    }
  }, [currentApplication])

  const columns = useMemo(
    () =>
      responseTableFields.map(({ label, name }) => ({
        Header: label ?? name,
        accessor: name,
      })),
    [responseTableFields],
  )

  return (
    <div className="columns">
      <div className="column is-one-third" style={{ marginRight: '100px' }}>
        <StyledHeader className="is-pulled-left">Applications</StyledHeader>
        <FormsCardWrapper>
          <FormsCard className="card">
            {applications.map((application) => (
              <Form
                application={application}
                setApplication={setCurrentApplication}
              />
            ))}
          </FormsCard>
        </FormsCardWrapper>
      </div>
      <div className="column is-two-thirds">
        <StyledResponses>
          <StyledHeader style={{ marginBottom: '2px' }}>Responses</StyledHeader>
          <Table
            data={responses.map((item, index) =>
              item.id ? item : { ...item, id: index },
            )}
            columns={responseTableFields}
            searchableColumns={['name']}
            filterOptions={[]}
          />
        </StyledResponses>
      </div>
    </div>
  )
}

export default ApplicationsPage