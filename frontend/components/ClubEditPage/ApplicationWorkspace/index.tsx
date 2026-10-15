import moment from 'moment-timezone'
import { ReactElement, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { Icon, Loading } from '~/components/common'
import {
  ALLBIRDS_GRAY,
  CLUBS_BLUE,
  CLUBS_GREY,
  MD,
  mediaMaxWidth,
} from '~/constants'
import { Club } from '~/types'
import { doApiRequest } from '~/utils'

import QuestionsTab from './QuestionsTab'
import ResponsesTab from './ResponsesTab'
import SettingsTab from './SettingsTab'
import {
  applicationState,
  Muted,
  Panel,
  Pill,
  useConfirm,
  WorkspaceApplication,
} from './shared'

const TABS = [
  { name: 'questions', label: 'Questions' },
  { name: 'responses', label: 'Responses' },
  { name: 'settings', label: 'Settings' },
] as const

type Tab = (typeof TABS)[number]['name']

const Layout = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
  align-items: start;

  ${mediaMaxWidth(MD)} {
    grid-template-columns: 1fr;
  }
`

const Sidebar = styled.nav`
  ul {
    margin-top: 12px;
  }

  li button {
    width: 100%;
    text-align: left;
    border: none;
    background: none;
    border-radius: 8px;
    padding: 10px 12px;
    cursor: pointer;
    color: ${CLUBS_GREY};
  }

  li button:hover {
    background: #f7f7f8;
  }

  li button.is-selected {
    background: #eef0fe;
  }

  .name {
    display: block;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`

const Tabs = styled.div`
  display: flex;
  gap: 24px;
  border-bottom: 1px solid ${ALLBIRDS_GRAY};
  margin: 16px 0 20px;

  button {
    border: none;
    background: none;
    padding: 8px 0;
    cursor: pointer;
    font-size: 1rem;
    color: ${CLUBS_GREY};
    border-bottom: 3px solid transparent;
    margin-bottom: -1px;
  }

  button.is-active {
    color: ${CLUBS_BLUE};
    border-bottom-color: ${CLUBS_BLUE};
    font-weight: 600;
  }
`

const applicationLink = (club: Club, application: WorkspaceApplication) =>
  `${window.location.origin}/club/${club.code}/application/${application.id}`

/**
 * One place to build an application, share it, review its responses and
 * change its settings, laid out like Google Forms.
 */
export default function ApplicationWorkspace({
  club,
}: {
  club: Club
}): ReactElement {
  const [applications, setApplications] = useState<
    WorkspaceApplication[] | null
  >(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('questions')
  const [confirmDialog, confirm] = useConfirm()
  const baseUrl = `/clubs/${club.code}/applications/`

  // newest first, keeping the selection unless told what to select
  const load = async (select?: number): Promise<WorkspaceApplication[]> => {
    const resp = await doApiRequest(`${baseUrl}?format=json`)
    const loaded: WorkspaceApplication[] = await resp.json()
    loaded.sort((a, b) =>
      b.application_start_time.localeCompare(a.application_start_time),
    )
    setApplications(loaded)
    setSelectedId(
      (current) =>
        select ??
        (loaded.some(({ id }) => id === current) ? current : loaded[0]?.id) ??
        null,
    )
    return loaded
  }

  useEffect(() => {
    load()
  }, [club.code])

  const create = async () => {
    const now = moment()
    const resp = await doApiRequest(`${baseUrl}?format=json`, {
      method: 'POST',
      body: {
        name: 'Untitled application',
        // opens in a week, leaving time to write questions and committees,
        // which lock once the application opens
        application_start_time: now.clone().add(7, 'days').toISOString(),
        application_end_time: now.clone().add(21, 'days').toISOString(),
        result_release_time: now.clone().add(28, 'days').toISOString(),
      },
    })
    if (!resp.ok) {
      toast.error('Could not create an application. Please try again.')
      return
    }
    const created = await resp.json()
    await load(created.id)
    setTab('questions')
  }

  const duplicate = async (application: WorkspaceApplication) => {
    const resp = await doApiRequest(
      `${baseUrl}${application.id}/duplicate/?format=json`,
      { method: 'POST' },
    )
    if (!resp.ok) {
      toast.error('Could not duplicate this application.')
      return
    }
    // the copy is the newest application, so it has the highest id
    const all = await load()
    setSelectedId(Math.max(...all.map(({ id }) => id)))
    setTab('settings')
    toast.success('Copied. Set the new dates, then save.')
  }

  const remove = async (application: WorkspaceApplication) => {
    const confirmed = await confirm({
      title: `Delete "${application.name}"?`,
      message:
        "Its questions and every answer to them are deleted too. This can't be undone.",
      confirmLabel: 'Delete application',
    })
    if (!confirmed) {
      return
    }
    const resp = await doApiRequest(
      `${baseUrl}${application.id}/?format=json`,
      {
        method: 'DELETE',
      },
    )
    if (!resp.ok) {
      toast.error('Could not delete this application.')
      return
    }
    toast.success('Application deleted.')
    await load()
    setTab('questions')
  }

  if (applications === null) {
    return <Loading />
  }

  const selected = applications.find(({ id }) => id === selectedId)

  if (selected == null) {
    return (
      <Panel className="has-text-centered py-6">
        <h3 className="title is-4">Create your first application</h3>
        <p className="mb-4">
          Write your questions here, or import an existing Google Form. Then
          share the link with students and review responses in one place.
        </p>
        {!club.is_wharton && (
          <button className="button is-primary" onClick={create}>
            <Icon name="plus" alt="" /> New application
          </button>
        )}
      </Panel>
    )
  }

  const state = applicationState(selected)

  return (
    <Layout>
      <Sidebar>
        {!club.is_wharton && (
          <button className="button is-primary is-fullwidth" onClick={create}>
            <Icon name="plus" alt="" /> New application
          </button>
        )}
        <ul>
          {applications.map((application) => (
            <li key={application.id}>
              <button
                className={application.id === selected.id ? 'is-selected' : ''}
                onClick={() => setSelectedId(application.id)}
              >
                <span className="name">{application.name}</span>
                <Muted>
                  {application.cycle} · {applicationState(application).label}
                </Muted>
              </button>
            </li>
          ))}
        </ul>
      </Sidebar>

      <div style={{ minWidth: 0 }}>
        <Header>
          <div>
            <h2 className="title is-4 mb-1">{selected.name}</h2>
            <Pill $status={state.tone}>{state.label}</Pill>{' '}
            <Muted>{state.detail}</Muted>
          </div>
          <div className="buttons">
            <button
              className="button is-small"
              onClick={() =>
                navigator.clipboard
                  .writeText(applicationLink(club, selected))
                  .then(() => toast.success('Link copied. Share it anywhere.'))
              }
            >
              <Icon name="link" alt="" /> Copy link
            </button>
            <a
              className="button is-small"
              href={applicationLink(club, selected)}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="eye" alt="" /> Preview
            </a>
            {!club.is_wharton && (
              <>
                <button
                  className="button is-small"
                  onClick={() => duplicate(selected)}
                >
                  <Icon name="clipboard" alt="" /> Duplicate
                </button>
                <button
                  className="button is-small is-danger is-outlined"
                  onClick={() => remove(selected)}
                >
                  <Icon name="trash" alt="" /> Delete
                </button>
              </>
            )}
          </div>
        </Header>

        <Tabs>
          {TABS.map(({ name, label }) => (
            <button
              key={name}
              className={tab === name ? 'is-active' : ''}
              onClick={() => setTab(name)}
            >
              {label}
            </button>
          ))}
        </Tabs>

        {tab === 'questions' && (
          <QuestionsTab
            key={selected.id}
            clubCode={club.code}
            application={selected}
            onApplicationChanged={() => load()}
          />
        )}
        {tab === 'responses' && (
          <ResponsesTab
            key={selected.id}
            clubCode={club.code}
            application={selected}
          />
        )}
        {tab === 'settings' && (
          <SettingsTab
            key={selected.id}
            club={club}
            application={selected}
            onSaved={() => load()}
          />
        )}
        {confirmDialog}
      </div>
    </Layout>
  )
}
