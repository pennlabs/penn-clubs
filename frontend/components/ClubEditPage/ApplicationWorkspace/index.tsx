import moment from 'moment-timezone'
import { ReactElement, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { Icon, Loading } from '~/components/common'
import { MD, mediaMaxWidth } from '~/constants'
import { Club } from '~/types'
import { doApiRequest } from '~/utils'

import { ADMIN_NAVY } from '../adminTheme'
import {
  AdminDanger,
  AdminGhost,
  AdminGhostLink,
  AdminPrimary,
} from '../adminControls'
import QuestionsTab from './QuestionsTab'
import ResponsesTab from './ResponsesTab'
import SettingsTab from './SettingsTab'
import {
  applicationState,
  Muted,
  Pill,
  SegmentedControl,
  useConfirm,
  WorkspaceApplication,
} from './shared'

const TABS = [
  { name: 'questions', label: 'Questions' },
  { name: 'responses', label: 'Responses' },
  { name: 'settings', label: 'Settings' },
] as const

type Tab = (typeof TABS)[number]['name']

const Layout = styled.div<{ $listOpen?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $listOpen }) =>
    $listOpen ? 'minmax(160px, 1fr) minmax(0, 4fr)' : 'minmax(0, 1fr)'};
  gap: 16px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
  height: 100%;

  ${mediaMaxWidth(MD)} {
    grid-template-columns: 1fr;
    height: auto;
  }
`

const Pane = styled.div`
  background: #fff;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  padding: 16px;
`

const CloseButton = styled.button`
  appearance: none;
  align-items: center;
  background: #f3f3f3;
  border: 0;
  border-radius: 8px;
  color: ${ADMIN_NAVY};
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  height: 32px;
  justify-content: center;
  padding: 0;
  width: 32px;

  &:hover {
    background: #e8e8e8;
  }
`

const SideHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  ${AdminPrimary} {
    flex: 1;
    min-width: 0;
  }

  ${CloseButton} {
    margin-left: auto;
  }
`

const Sidebar = styled.nav`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;

  ul {
    margin: 12px 0 0;
    overflow: auto;
  }

  li button {
    width: 100%;
    text-align: left;
    border: none;
    background: none;
    border-radius: 8px;
    padding: 10px 12px;
    cursor: pointer;
    color: ${ADMIN_NAVY};
  }

  li button:hover {
    background: #f7f8fb;
  }

  li button.is-selected {
    background: #eef0ff;
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
  flex-shrink: 0;
  gap: 8px;
`

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`

const TabBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
  gap: 8px;
  margin: 12px 0 16px;
`

const ScrollBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
`

const applicationLink = (club: Club, application: WorkspaceApplication) =>
  `${window.location.origin}/club/${club.code}/application/${application.id}`

/**
 * One place to build an application, share it, review its responses and
 * change its settings, laid out like Google Forms.
 */
export default function ApplicationWorkspace({
  club,
  listOpen = true,
  onCloseList,
}: {
  club: Club
  listOpen?: boolean
  onCloseList?: () => void
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
    const payload = await resp.json()
    const loaded: WorkspaceApplication[] = Array.isArray(payload) ? payload : []
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

  const sidebar = listOpen ? (
    <Pane>
      <Sidebar>
        <SideHead>
          {!club.is_wharton && (
            <AdminPrimary type="button" onClick={create}>
              <Icon name="plus" alt="" /> New application
            </AdminPrimary>
          )}
          {onCloseList && (
            <CloseButton
              type="button"
              aria-label="Close applications list"
              title="Close applications list"
              onClick={onCloseList}
            >
              <Icon name="x" alt="" size="1rem" fitSize />
            </CloseButton>
          )}
        </SideHead>
        <ul>
          {applications.map((application) => (
            <li key={application.id}>
              <button
                className={application.id === selectedId ? 'is-selected' : ''}
                onClick={() => setSelectedId(application.id)}
              >
                <span className="name">{application.name}</span>
                <Muted>
                  {[application.cycle, applicationState(application).label]
                    .filter(Boolean)
                    .join(' · ')}
                </Muted>
              </button>
            </li>
          ))}
        </ul>
      </Sidebar>
    </Pane>
  ) : null

  if (selected == null) {
    return (
      <Layout $listOpen={listOpen}>
        {sidebar}
        <Pane style={{ justifyContent: 'center', textAlign: 'center' }}>
          <h3 className="title is-5" style={{ color: ADMIN_NAVY }}>
            Create your first application
          </h3>
          <p className="mb-4">
            Write your questions here, then share the link with students and
            review responses in one place.
          </p>
          {!club.is_wharton && (
            <AdminPrimary type="button" onClick={create}>
              <Icon name="plus" alt="" /> New application
            </AdminPrimary>
          )}
        </Pane>
      </Layout>
    )
  }

  const state = applicationState(selected)

  const mainTabs = (
    <SegmentedControl>
      {TABS.map(({ name, label }) => (
        <button
          key={name}
          className={tab === name ? 'is-active' : ''}
          onClick={() => setTab(name)}
        >
          {label}
        </button>
      ))}
    </SegmentedControl>
  )

  return (
    <Layout $listOpen={listOpen}>
      {sidebar}

      <Pane>
        <Header>
          <div>
            <h2
              className="title is-4 mb-1"
              style={{ color: ADMIN_NAVY, fontSize: '1.25rem' }}
            >
              {selected.name}
            </h2>
            <Pill $status={state.tone}>{state.label}</Pill>{' '}
            <Muted>{state.detail}</Muted>
          </div>
          <ActionRow>
            <AdminGhost
              type="button"
              onClick={() =>
                navigator.clipboard
                  .writeText(applicationLink(club, selected))
                  .then(() => toast.success('Link copied. Share it anywhere.'))
              }
            >
              <Icon name="link" alt="" /> Copy link
            </AdminGhost>
            <AdminGhostLink
              href={applicationLink(club, selected)}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="eye" alt="" /> Preview
            </AdminGhostLink>
            {!club.is_wharton && (
              <>
                <AdminGhost type="button" onClick={() => duplicate(selected)}>
                  <Icon name="clipboard" alt="" /> Duplicate
                </AdminGhost>
                <AdminDanger type="button" onClick={() => remove(selected)}>
                  <Icon name="trash" alt="" /> Delete
                </AdminDanger>
              </>
            )}
          </ActionRow>
        </Header>

        {tab === 'questions' && (
          <>
            <TabBar>{mainTabs}</TabBar>
            <ScrollBody>
              <QuestionsTab
                key={selected.id}
                clubCode={club.code}
                application={selected}
                onApplicationChanged={() => load()}
              />
            </ScrollBody>
          </>
        )}
        {tab === 'responses' && (
          <ResponsesTab
            key={selected.id}
            clubCode={club.code}
            application={selected}
            chrome={(toolbar) => (
              <TabBar>
                {mainTabs}
                {toolbar}
              </TabBar>
            )}
          />
        )}
        {tab === 'settings' && (
          <>
            <TabBar>{mainTabs}</TabBar>
            <ScrollBody>
              <SettingsTab
                key={selected.id}
                club={club}
                application={selected}
                onSaved={() => load()}
              />
            </ScrollBody>
          </>
        )}
        {confirmDialog}
      </Pane>
    </Layout>
  )
}
