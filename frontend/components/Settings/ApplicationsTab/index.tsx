import Link from 'next/link'
import { ReactElement, ReactNode, useMemo, useState } from 'react'
import styled from 'styled-components'

import { EmptyState, Icon, Modal, Text } from '~/components/common'
import {
  ALLBIRDS_GRAY,
  BORDER,
  CLUBS_BLUE,
  LIGHT_GRAY,
  MEDIUM_GRAY,
} from '~/constants/colors'
import { BORDER_RADIUS } from '~/constants/measurements'
import {
  UserApplication,
  UserApplicationsResponse,
  UserApplicationSubmission,
} from '~/types'
import { doApiRequest } from '~/utils'

import ApplicationCard from './ApplicationCard'
import ResponsesModal from './ResponsesModal'
import { bucketApplications } from './shared'

/** How many cards a collapsed section shows before it fades out. */
const PEEK_COUNT = 2

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`

const Blurb = styled(Text)`
  margin-bottom: 0;
  max-width: 40rem;
  font-size: 0.9375rem;
`

const Search = styled.div`
  margin-left: auto;
  position: relative;

  & input {
    padding-left: 2.25rem;
    min-width: 16rem;
  }

  & span {
    position: absolute;
    left: 0.7rem;
    top: 50%;
    transform: translateY(-50%);
    color: ${LIGHT_GRAY};
    pointer-events: none;
  }
`

const SectionWrapper = styled.div`
  margin-bottom: 1.875rem;

  &.is-collapsed {
    margin-bottom: 2.75rem;
  }
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding-bottom: 0.55rem;
  margin-bottom: 0.875rem;
  border-bottom: 1px solid ${ALLBIRDS_GRAY};
  cursor: pointer;
  user-select: none;
`

const SectionTitle = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: ${MEDIUM_GRAY};
`

const Count = styled.span`
  font-size: 0.6875rem;
  font-weight: 600;
  color: ${MEDIUM_GRAY};
  background: ${ALLBIRDS_GRAY};
  border-radius: 999px;
  padding: 0.05rem 0.5rem;
`

const SectionNote = styled.span`
  margin-left: auto;
  font-size: 0.75rem;
  color: ${LIGHT_GRAY};
`

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const Peek = styled.div`
  position: relative;
`

const PeekInner = styled(Cards)`
  max-height: 21.5rem;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, black 76%, transparent 99%);
  -webkit-mask-image: linear-gradient(to bottom, black 76%, transparent 99%);
`

const Fade = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.75rem;
  display: flex;
  justify-content: center;
`

const MoreButton = styled.button`
  background: white;
  border: 1px solid ${BORDER};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  color: ${MEDIUM_GRAY};
  font-weight: 500;
  gap: 0.35rem;

  &:hover {
    color: ${CLUBS_BLUE};
    border-color: ${CLUBS_BLUE};
  }
`

const Disclosure = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding-top: 0.9rem;
  border-top: 1px solid ${ALLBIRDS_GRAY};
  color: ${MEDIUM_GRAY};
  cursor: pointer;
  user-select: none;
`

const Empty = styled.div`
  background: white;
  border: 1px solid ${BORDER};
  border-radius: ${BORDER_RADIUS};
  padding: 2.5rem;
  text-align: center;
`

type SectionProps = {
  name: string
  note?: string
  applications: UserApplication[]
  collapsible?: boolean
  children: (application: UserApplication) => ReactNode
}

const Section = ({
  name,
  note,
  applications,
  collapsible = true,
  children,
}: SectionProps): ReactElement<any> | null => {
  const [open, setOpen] = useState<boolean>(false)
  if (applications.length === 0) return null

  const collapsed = collapsible && !open && applications.length > PEEK_COUNT
  const shown = collapsed ? applications.slice(0, PEEK_COUNT) : applications
  const hidden = applications.length - shown.length

  const Container = collapsed ? PeekInner : Cards
  const body = (
    <Container>{shown.map((application) => children(application))}</Container>
  )

  return (
    <SectionWrapper className={collapsed ? 'is-collapsed' : undefined}>
      <SectionHeader onClick={() => setOpen(!open)}>
        <Icon
          name={collapsed ? 'chevron-right' : 'chevron-down'}
          alt={collapsed ? 'expand' : 'collapse'}
          size="0.9rem"
        />
        <SectionTitle>{name}</SectionTitle>
        <Count>{applications.length}</Count>
        {note && <SectionNote>{note}</SectionNote>}
      </SectionHeader>
      {collapsed ? (
        <Peek>
          {body}
          <Fade>
            <MoreButton
              className="button is-small"
              onClick={() => setOpen(true)}
            >
              Show {hidden} more
              <Icon name="chevron-down" alt="" size="0.8rem" />
            </MoreButton>
          </Fade>
        </Peek>
      ) : (
        body
      )}
    </SectionWrapper>
  )
}

type Props = {
  initialData: UserApplicationsResponse | { detail: string }
}

const ApplicationsTab = ({ initialData }: Props): ReactElement<any> => {
  const [data, setData] = useState(initialData)
  const [query, setQuery] = useState<string>('')
  const [showPast, setShowPast] = useState<boolean>(false)
  const [viewing, setViewing] = useState<{
    application: UserApplication
    submission: UserApplicationSubmission
  } | null>(null)

  const isError = 'detail' in data
  const applications: UserApplication[] = isError
    ? []
    : (data as UserApplicationsResponse).results
  const savedClubCount = isError
    ? 0
    : (data as UserApplicationsResponse).saved_club_count

  const buckets = useMemo(
    () => bucketApplications(applications, query),
    [applications, query],
  )

  const removeSubmission = (submission: UserApplicationSubmission): void => {
    if (
      !confirm('Are you sure you want to permanently delete this submission?')
    ) {
      return
    }
    doApiRequest(`/submissions/${submission.pk}/?format=json`, {
      method: 'DELETE',
    }).then(() => {
      setViewing(null)
      setData((previous) => {
        if ('detail' in previous) return previous
        return {
          ...previous,
          results: previous.results.map((application) => ({
            ...application,
            submissions: application.submissions.filter(
              (existing) => existing.pk !== submission.pk,
            ),
          })),
        }
      })
    })
  }

  const card = (application: UserApplication): ReactElement<any> => (
    <ApplicationCard
      key={application.id}
      application={application}
      onViewResponses={(submission) => setViewing({ application, submission })}
      onDelete={removeSubmission}
    />
  )

  if (isError) {
    return <Text>{(data as { detail: string }).detail}</Text>
  }

  const nothingAtAll = applications.length === 0
  const nothingMatched =
    !nothingAtAll &&
    buckets.actionNeeded.length === 0 &&
    buckets.submitted.length === 0 &&
    buckets.closed.length === 0 &&
    buckets.past.length === 0

  return (
    <>
      <Toolbar>
        <Blurb>
          Everything you&apos;ve applied to, plus open applications from clubs
          you&apos;ve bookmarked or subscribed to. Status is tracked per
          committee.
        </Blurb>
        {!nothingAtAll && (
          <Search>
            <span>
              <Icon name="search" alt="search" size="0.9rem" />
            </span>
            <input
              className="input"
              type="text"
              value={query}
              placeholder="Search applications"
              aria-label="Search applications"
              onChange={(e) => setQuery(e.target.value)}
            />
          </Search>
        )}
      </Toolbar>

      {nothingAtAll ? (
        <Empty>
          <EmptyState name="hiring" size="14rem" />
          {savedClubCount > 0 ? (
            <>
              <Text>
                None of the {savedClubCount} clubs you follow are accepting
                applications right now. We&apos;ll list them here as they open.
              </Text>
            </>
          ) : (
            <>
              <Text>
                Bookmark or subscribe to a club and its application will appear
                here while it&apos;s open. Anything you submit stays here
                through the decision.
              </Text>
              <Link href="/clubs" className="button is-primary">
                Browse clubs
              </Link>
            </>
          )}
        </Empty>
      ) : nothingMatched ? (
        <Text>
          Nothing matches &ldquo;{query}&rdquo;. Try a club or committee name.
        </Text>
      ) : (
        <>
          <Section
            name="Action needed"
            note="Open now, nothing submitted yet"
            applications={buckets.actionNeeded}
          >
            {card}
          </Section>
          <Section
            name="Submitted · still open"
            note="You can still edit and resubmit"
            applications={buckets.submitted}
          >
            {card}
          </Section>
          <Section
            name="Closed"
            note="Clubs are not required to post decisions here"
            applications={buckets.closed}
          >
            {card}
          </Section>

          {buckets.past.length > 0 &&
            (showPast ? (
              <Section
                name="Past applications"
                applications={buckets.past}
                collapsible={false}
              >
                {card}
              </Section>
            ) : (
              <Disclosure onClick={() => setShowPast(true)}>
                <Icon name="chevron-right" alt="expand" size="0.9rem" />
                <SectionTitle>Past applications</SectionTitle>
                <Count>{buckets.past.length}</Count>
                <SectionNote>Earlier seasons</SectionNote>
              </Disclosure>
            ))}
        </>
      )}

      {viewing != null && (
        <Modal
          show={true}
          closeModal={() => setViewing(null)}
          width="45rem"
          marginBottom={false}
        >
          <ResponsesModal
            application={viewing.application}
            submission={viewing.submission}
            onDelete={() => removeSubmission(viewing.submission)}
            onClose={() => setViewing(null)}
          />
        </Modal>
      )}
    </>
  )
}

export default ApplicationsTab
