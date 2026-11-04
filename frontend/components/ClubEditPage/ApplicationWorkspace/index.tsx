import moment from 'moment-timezone'
import { ReactElement, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { Icon, Loading } from '~/components/common'
import { CLUBS_BLUE, MD, mediaMaxWidth } from '~/constants'
import { Club } from '~/types'
import { doApiRequest } from '~/utils'

import { ADMIN_NAVY } from '../adminTheme'
import { AdminPrimary } from '../adminControls'
import { ViewLink } from '../ClubAdminShell'
import QuestionsTab from './QuestionsTab'
import ResponsesTab from './ResponsesTab'
import SettingsTab from './SettingsTab'
import {
  applicationState,
  Muted,
  Pill,
  RESPONSE_TAB_ACTIONS_ID,
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

const Pane = styled.div<{ $flushList?: boolean }>`
  background: #fff;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  padding: ${({ $flushList }) => ($flushList ? '16px 0 0' : '16px')};
`

const Stack = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
`

const TopBar = styled.div`
  background: #fff;
  border-radius: 10px;
  flex-shrink: 0;
  min-width: 0;
  padding: 16px;
`

const BodyBox = styled.div`
  background: #fff;
  border-radius: 10px;
  display: flex;
  flex: 1;
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
  padding: 0 16px;

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
    flex: 1;
    margin: 12px 0 0;
    overflow: auto;
  }

  li {
    position: relative;
  }

  li + li .pick {
    border-top: 1px solid #f0f0f2;
  }

  li:hover .more,
  li .more.is-open {
    opacity: 1;
  }

  .pick {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    text-align: left;
    border: none;
    background: none;
    border-radius: 0;
    padding: 12px 40px 12px 16px;
    cursor: pointer;
    color: ${ADMIN_NAVY};
    font-size: 13px;
    line-height: 1.3;
  }

  .pick:hover {
    background: #f7f8fb;
  }

  .pick.is-selected {
    background: #eef0ff;
  }

  .name {
    display: block;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ${Muted} {
    font-size: 11px;
    line-height: 1.25;
  }
`

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 12px 16px;
`

const TitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 12px;
  min-width: 0;

  h2 {
    margin: 0;
  }
`

const StatusBlock = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
  text-align: right;
`

const MoreButton = styled.button`
  appearance: none;
  align-items: center;
  background: #fff;
  border: 1px solid #e4e4e4;
  border-radius: 8px;
  color: ${ADMIN_NAVY};
  cursor: pointer;
  display: inline-flex;
  height: 24px;
  justify-content: center;
  opacity: 0;
  padding: 0;
  position: absolute;
  right: 10px;
  top: 10px;
  width: 24px;

  svg {
    transform: rotate(90deg);
  }

  &:hover {
    background: #f7f8fb;
  }
`

const ItemMenu = styled.div<{ $top: number; $left: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  z-index: 75;
  min-width: 160px;
  padding: 6px 0;
  background: #fff;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);

  button {
    display: block;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: none;
    color: ${ADMIN_NAVY};
    cursor: pointer;
    font-size: 13px;
    text-align: left;
  }

  button:hover {
    background: #f5f6fa;
  }

  button.is-danger {
    color: #a32020;
  }
`

const TabBar = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
  gap: 8px;
  margin-top: 4px;
  min-width: 0;

  .response-actions {
    display: inline-flex;
    flex: 1;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
`

const TabPill = styled.div`
  display: inline-flex;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid ${CLUBS_BLUE};
  border-radius: 999px;
  background: #fff;

  > button:first-of-type {
    border-left: none;
  }
`

const TabButton = styled.button<{ $active?: boolean }>`
  appearance: none;
  background: ${({ $active }) => ($active ? CLUBS_BLUE : '#fff')};
  border: none;
  border-left: 1px solid ${CLUBS_BLUE};
  color: ${({ $active }) => ($active ? '#fff' : CLUBS_BLUE)};
  cursor: pointer;
  flex-shrink: 0;
  font-size: 0.875rem;
  padding: 6px 14px;
  white-space: nowrap;
`

const ResponseSplit = styled.div`
  display: flex;
  min-width: 0;
`

const SplitPane = styled.div<{ $open: boolean }>`
  display: flex;
  max-width: ${({ $open }) => ($open ? '22rem' : '0')};
  min-width: 0;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  overflow: hidden;
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transform: ${({ $open }) => ($open ? 'scaleX(1)' : 'scaleX(0.84)')};
  transform-origin: left center;
  transition:
    max-width 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.22s ease,
    transform 0.34s cubic-bezier(0.22, 1, 0.36, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    transform: none;
  }

  ${TabButton} {
    border-left: 1px solid ${CLUBS_BLUE};
  }
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

function ListItemMenu({
  canManage,
  onCopy,
  onDuplicate,
  onDelete,
}: {
  canManage: boolean
  onCopy: () => void
  onDuplicate: () => void
  onDelete: () => void
}): ReactElement {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      return
    }
    const rect = buttonRef.current.getBoundingClientRect()
    const width = 160
    const height = canManage ? 132 : 44
    const left = Math.min(
      Math.max(8, rect.right - width),
      window.innerWidth - width - 8,
    )
    const top =
      rect.bottom + 4 + height > window.innerHeight
        ? Math.max(8, rect.top - height - 4)
        : rect.bottom + 4
    setPos({ top, left })
  }, [open, canManage])

  useEffect(() => {
    if (!open) {
      return
    }
    const close = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    const onScroll = () => setOpen(false)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  return (
    <>
      <MoreButton
        ref={buttonRef}
        className={open ? 'more is-open' : 'more'}
        type="button"
        aria-label="Application actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation()
          setOpen(!open)
        }}
      >
        <Icon name="more-horizontal" alt="" size="0.95rem" fitSize />
      </MoreButton>
      {open &&
        createPortal(
          <ItemMenu
            ref={menuRef}
            role="menu"
            $top={pos.top}
            $left={pos.left}
          >
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation()
                onCopy()
                setOpen(false)
              }}
            >
              Copy link
            </button>
            {canManage && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDuplicate()
                    setOpen(false)
                  }}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  className="is-danger"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete()
                    setOpen(false)
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </ItemMenu>,
          document.body,
        )}
    </>
  )
}

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
  const [responseView, setResponseView] = useState<'summary' | 'individual'>(
    'summary',
  )
  const [responseCount, setResponseCount] = useState<number | null>(null)
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

  useEffect(() => {
    setResponseCount(null)
  }, [selectedId])

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
    <Pane $flushList>
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
                type="button"
                className={`pick${application.id === selectedId ? ' is-selected' : ''}`}
                onClick={() => setSelectedId(application.id)}
              >
                <span className="name">{application.name}</span>
                <Muted>
                  {[application.cycle, applicationState(application).label]
                    .filter(Boolean)
                    .join(' · ')}
                </Muted>
              </button>
              <ListItemMenu
                canManage={!club.is_wharton}
                onCopy={() =>
                  navigator.clipboard
                    .writeText(applicationLink(club, application))
                    .then(() =>
                      toast.success('Link copied. Share it anywhere.'),
                    )
                }
                onDuplicate={() => duplicate(application)}
                onDelete={() => remove(application)}
              />
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

  const responsesOpen = tab === 'responses'
  const openResponses = (view: 'summary' | 'individual') => {
    setResponseView(view)
    setTab('responses')
  }

  const mainTabs = (
    <TabPill>
      <TabButton
        type="button"
        $active={tab === 'questions'}
        onClick={() => setTab('questions')}
      >
        Questions
      </TabButton>
      <ResponseSplit>
        <TabButton
          type="button"
          $active={responsesOpen && responseView === 'summary'}
          onClick={() => openResponses('summary')}
        >
          {responsesOpen ? 'Summary' : 'Responses'}
        </TabButton>
        <SplitPane $open={responsesOpen}>
          <TabButton
            type="button"
            $active={responseView === 'individual'}
            onClick={() => openResponses('individual')}
          >
            Individual
            {responseCount != null ? ` (${responseCount})` : ''}
          </TabButton>
        </SplitPane>
      </ResponseSplit>
      <TabButton
        type="button"
        $active={tab === 'settings'}
        onClick={() => setTab('settings')}
      >
        Settings
      </TabButton>
    </TabPill>
  )

  const header = (
    <Header>
      <TitleRow>
        <h2
          className="title is-4 mb-0"
          style={{ color: ADMIN_NAVY, fontSize: '1.25rem' }}
        >
          {selected.name}
        </h2>
        <ViewLink
          href={applicationLink(club, selected)}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 16 }}
        >
          Preview Form
          <Icon name="external-link" alt="" size="0.9rem" />
        </ViewLink>
      </TitleRow>
      <StatusBlock>
        <Pill $status={state.tone}>{state.label}</Pill>
        <Muted>{state.detail}</Muted>
      </StatusBlock>
    </Header>
  )

  return (
    <Layout $listOpen={listOpen}>
      {sidebar}

      <Stack>
        <TopBar>
          {header}
          <TabBar>
            {mainTabs}
            <span id={RESPONSE_TAB_ACTIONS_ID} className="response-actions" />
          </TabBar>
        </TopBar>

        {tab === 'questions' && (
          <BodyBox>
            <ScrollBody>
              <QuestionsTab
                key={selected.id}
                clubCode={club.code}
                application={selected}
                onApplicationChanged={() => load()}
              />
            </ScrollBody>
          </BodyBox>
        )}
        {tab === 'responses' && (
          <ResponsesTab
            key={selected.id}
            clubCode={club.code}
            application={selected}
            view={responseView}
            onSubmissionCount={setResponseCount}
          />
        )}
        {tab === 'settings' && (
          <BodyBox>
            <ScrollBody>
              <SettingsTab
                key={selected.id}
                club={club}
                application={selected}
                onSaved={() => load()}
              />
            </ScrollBody>
          </BodyBox>
        )}
        {confirmDialog}
      </Stack>
    </Layout>
  )
}
