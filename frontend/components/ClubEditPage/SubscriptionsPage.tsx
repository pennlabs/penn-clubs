import { Field, Form, Formik, FormikHelpers } from 'formik'
import React, { ReactElement, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import {
  Club,
  SubscriberListItem,
  SubscriptionGroup,
  SubscriptionQuestionType,
} from '~/types'
import { doApiRequest, formatResponse, getApiUrl } from '~/utils'

import { Loading, Modal, Text } from '../common'
import { Icon } from '../common/Icon'
import Table from '../common/Table'
import {
  CheckboxField,
  CreatableMultipleSelectField,
  DateTimeField,
  SelectField,
  TextField,
} from '../FormComponents'
import ModelForm from '../ModelForm'
import BaseCard from './BaseCard'
import {
  FormWrapper,
  ModalContainer,
  StyledHeader,
  TableScroll,
} from './FormManagementStyles'
import QRCodeCard, { QRCodeType } from './QRCodeCard'

type Props = {
  club: Club
}

const QUESTION_TYPES = [
  { value: SubscriptionQuestionType.FreeResponse, label: 'Free Response' },
  { value: SubscriptionQuestionType.MultipleChoice, label: 'Multiple Choice' },
  { value: SubscriptionQuestionType.ShortAnswer, label: 'Short Answer' },
  { value: SubscriptionQuestionType.InfoText, label: 'Informational Text' },
]

const ATTRIBUTION_LABELS: Record<string, string> = {
  direct: 'Club Page',
  fair: 'Activities Fair',
  search: 'Search Results',
  email: 'Email / Magic Link',
  external: 'External Link',
  import: 'Imported',
  unknown: 'Unknown',
}

/** Status tags shown beside a form name, shared by the list and detail views. */
const StatusTags = ({ group }: { group: SubscriptionGroup }) => (
  <>
    {group.is_default && <span className="tag is-info ml-2">Default</span>}
    {group.is_archived ? (
      <span className="tag is-warning ml-2">Archived</span>
    ) : group.is_active ? (
      <span className="tag is-success ml-2">Active</span>
    ) : (
      <span className="tag is-light ml-2">Inactive</span>
    )}
  </>
)

type InnerTab = 'overview' | 'questions' | 'subscribers' | 'distribution'

const INNER_TABS: { key: InnerTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'questions', label: 'Questions' },
  { key: 'subscribers', label: 'Subscribers' },
  { key: 'distribution', label: 'Distribution' },
]

/* -------------------------------------------------------------------------- */
/* Overview                                                                    */
/* -------------------------------------------------------------------------- */

const OverviewTab = ({
  club,
  group,
  onUpdated,
}: {
  club: Club
  group: SubscriptionGroup
  onUpdated: () => void
}): ReactElement<any> => {
  const [pending, setPending] = useState(false)
  const baseUrl = `/clubs/${club.code}/subscription-groups/${group.id}`

  const handleSave = async (
    values: Partial<SubscriptionGroup>,
    { setStatus }: FormikHelpers<any>,
  ) => {
    const resp = await doApiRequest(`${baseUrl}/?format=json`, {
      method: 'PATCH',
      body: values,
    })

    if (resp.ok) {
      setStatus({})
      toast.success('Form updated.')
      onUpdated()
      return
    }

    // Field errors render from Formik's `status`, not `errors` — see
    // useFieldWrapper in FormComponents. Pass the DRF error dict straight
    // through so messages appear under the field they belong to, and toast
    // as well so the failure is visible without scrolling.
    const err = await resp.json().catch(() => null)
    if (err && typeof err === 'object') {
      setStatus(err)
      toast.error(formatResponse(err))
    } else {
      toast.error('Failed to update form.')
    }
  }

  const postAction = async (action: string, success: string) => {
    setPending(true)
    const resp = await doApiRequest(`${baseUrl}/${action}/?format=json`, {
      method: 'POST',
    })
    setPending(false)
    if (resp.ok) {
      toast.success(success)
      onUpdated()
    } else {
      const data = await resp.json().catch(() => ({}))
      toast.error(data.detail ?? 'Action failed.')
    }
  }

  return (
    <>
      <BaseCard title="At a Glance">
        <div className="columns">
          <div className="column has-text-centered">
            <p className="heading">Subscribers</p>
            <p className="title">{group.subscriber_count}</p>
          </div>
          <div className="column has-text-centered">
            <p className="heading">Questions</p>
            <p className="title">{group.question_count}</p>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Settings">
        <Formik
          enableReinitialize
          initialValues={{
            name: group.name,
            description: group.description ?? '',
            is_active: group.is_active,
            opens_at: group.opens_at,
            closes_at: group.closes_at,
          }}
          onSubmit={handleSave}
        >
          {({ isSubmitting }) => (
            <Form>
              <Field name="name" label="Name" as={TextField} required />
              <Field name="description" label="Description" as={TextField} />
              <Field
                name="is_active"
                label="Active (accepting submissions)"
                as={CheckboxField}
              />
              <Field
                name="opens_at"
                label="Opens At"
                as={DateTimeField}
                helpText="Leave blank to accept submissions as soon as the form is active."
              />
              <Field
                name="closes_at"
                label="Closes At"
                as={DateTimeField}
                helpText="Leave blank to keep the form open indefinitely."
              />
              <button
                type="submit"
                className="button is-primary"
                disabled={isSubmitting}
              >
                Save
              </button>
            </Form>
          )}
        </Formik>
      </BaseCard>

      <BaseCard title="Default Subscription Form">
        <Text>
          When a form is set as the default, the subscribe button on the club
          page opens it instead of subscribing immediately. Until then, students
          are subscribed in one click.
        </Text>
        {group.is_default ? (
          <span className="tag is-info">
            This is the default subscription form.
          </span>
        ) : (
          <button
            className="button is-primary"
            disabled={pending || group.is_archived}
            onClick={() => postAction('set-default', 'Default form updated.')}
          >
            <Icon name="check" alt="set default" /> Set as Default
          </button>
        )}
        {group.is_archived && !group.is_default && (
          <p className="help">An archived form cannot be made the default.</p>
        )}
      </BaseCard>

      <BaseCard title="Danger Zone">
        {group.is_archived ? (
          <>
            <Text>
              This form is archived. It accepts no new submissions, and existing
              subscriber data is retained.
            </Text>
            <button
              className="button is-warning"
              disabled={pending}
              onClick={() => postAction('unarchive', 'Form unarchived.')}
            >
              Unarchive Form
            </button>
          </>
        ) : (
          <>
            <Text>
              Archiving hides the form and stops new submissions. Subscribers
              already collected are kept, and the form can be restored later.
            </Text>
            <button
              className="button is-danger"
              disabled={pending}
              onClick={() => {
                if (
                  confirm(
                    'Are you sure you want to archive this subscription form?',
                  )
                ) {
                  postAction('archive', 'Form archived.')
                }
              }}
            >
              Archive Form
            </button>
          </>
        )}
      </BaseCard>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Questions                                                                   */
/* -------------------------------------------------------------------------- */

const QuestionsTab = ({
  club,
  group,
  onUpdated,
}: {
  club: Club
  group: SubscriptionGroup
  onUpdated: () => void
}): ReactElement<any> => {
  // Formik cannot drive conditional fields on its own, so mirror the applications
  // question editor and track the in-progress question type locally.
  const [questionType, setQuestionType] =
    useState<SubscriptionQuestionType | null>(null)
  const [multipleChoices, setMultipleChoices] =
    useState<{ label: string; value: string }[]>()

  const baseUrl = `/clubs/${club.code}/subscription-groups/${group.id}/questions/`

  return (
    <BaseCard title="Questions">
      <Text>
        Questions are shown in the order below — drag a row to reorder them. A
        form with no questions subscribes students instantly when they open its
        magic link.
      </Text>
      <ModelForm
        baseUrl={baseUrl}
        draggable={true}
        confirmDeletion={true}
        noun="Question"
        empty="No questions yet. Students who open this form are subscribed right away."
        tableFields={[
          { name: 'prompt', label: 'Prompt' },
          {
            name: 'question_type',
            label: 'Type',
            converter: (type) =>
              QUESTION_TYPES.find((x) => x.value === type)?.label ?? type,
          },
          {
            name: 'required',
            label: 'Required',
            converter: (required) => (required ? 'Yes' : 'No'),
          },
        ]}
        fields={
          <>
            <Field
              name="question_type"
              as={SelectField}
              choices={QUESTION_TYPES}
              required={true}
              helpText="Type of question on the subscription form."
              valueDeserialize={(a: SubscriptionQuestionType) =>
                QUESTION_TYPES.find((x) => x.value === a)
              }
              serialize={(a: { value: SubscriptionQuestionType }) => a.value}
            />
            <Field
              name="prompt"
              as={TextField}
              required={true}
              helpText="Prompt shown to the student for this question."
            />
            {questionType !== SubscriptionQuestionType.InfoText && (
              <Field
                name="required"
                as={CheckboxField}
                label="Students must answer this question before subscribing"
              />
            )}
            {questionType === SubscriptionQuestionType.FreeResponse && (
              <Field
                name="word_limit"
                as={TextField}
                type="number"
                helpText="Word limit for this free response question. Leave at 0 for no limit."
              />
            )}
            {questionType === SubscriptionQuestionType.MultipleChoice && (
              <Field
                name="multiple_choice"
                as={CreatableMultipleSelectField}
                initialValues={multipleChoices}
                helpText="Options students can choose from. Press enter after each one."
              />
            )}
          </>
        }
        onChange={(value) => {
          setQuestionType(value.question_type as SubscriptionQuestionType)
          if (value.multiple_choice != null) {
            setMultipleChoices(
              (value.multiple_choice as { value: string }[]).map((item) => ({
                value: item.value,
                label: item.value,
              })),
            )
          }
        }}
        onUpdate={(questions) => {
          // Persist the dragged order; the endpoint assigns precedence by index.
          doApiRequest(`${baseUrl}reorder/?format=json`, {
            method: 'POST',
            body: { question_ids: questions.map((question) => question.id) },
          }).then((resp) => {
            if (!resp.ok) {
              toast.error('Failed to save question order.')
            }
          })
          onUpdated()
        }}
      />
    </BaseCard>
  )
}

/* -------------------------------------------------------------------------- */
/* Subscribers                                                                 */
/* -------------------------------------------------------------------------- */

type SubscriberDetail = SubscriberListItem & {
  responses: {
    question_id: number
    prompt: string
    question_type: number
    text: string
    multiple_choice_value: string | null
  }[]
}

type ExportFormat = {
  key: string
  label: string
  file: string
  help: string
}

/**
 * Every option here is a download of the same subscriber list — what differs is
 * the column layout each destination expects. Mailchimp and Google Groups are
 * both CSV files; they carry the exact headers those tools require on import,
 * so no column mapping is needed on the other end.
 */
const EXPORT_FORMATS: ExportFormat[] = [
  {
    key: 'csv',
    label: 'Spreadsheet (CSV)',
    file: 'emails.csv',
    help: 'Name, email, source and date. Opens in Excel, Numbers or Sheets.',
  },
  {
    key: 'tsv',
    label: 'Spreadsheet (TSV)',
    file: 'emails.tsv',
    help: 'Same columns as CSV, tab separated for tools that require it.',
  },
  {
    key: 'txt',
    label: 'Plain email list',
    file: 'emails-list.txt',
    help: 'Just the addresses, one per line — paste straight into a listserv.',
  },
  {
    key: 'mailchimp',
    label: 'Mailchimp',
    file: 'emails-mailchimp.csv',
    help: 'CSV with Email Address / First Name / Last Name headers.',
  },
  {
    key: 'google-groups',
    label: 'Google Groups',
    file: 'emails-google-groups.csv',
    help: 'CSV shaped for the Google Groups bulk member import.',
  },
]

const SubscribersTab = ({
  club,
  group,
}: {
  club: Club
  group: SubscriptionGroup
}): ReactElement<any> => {
  const [subscribers, setSubscribers] = useState<SubscriberListItem[] | null>(
    null,
  )
  const [detail, setDetail] = useState<SubscriberDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>(
    EXPORT_FORMATS[0],
  )

  const baseUrl = `/clubs/${club.code}/subscription-groups/${group.id}`

  useEffect(() => {
    setSubscribers(null)
    doApiRequest(`${baseUrl}/subscribers/?format=json`)
      .then((resp) => resp.json())
      .then((data) => {
        setSubscribers(Array.isArray(data) ? data : (data.results ?? []))
      })
      .catch(() => {
        toast.error('Failed to load subscribers.')
        setSubscribers([])
      })
  }, [group.id])

  const openDetail = (submissionId: number) => {
    setDetailLoading(true)
    setDetail(null)
    doApiRequest(`${baseUrl}/subscribers/${submissionId}/?format=json`)
      .then((resp) => resp.json())
      .then((data) => {
        setDetail(data)
        setDetailLoading(false)
      })
      .catch(() => {
        toast.error('Failed to load subscriber.')
        setDetailLoading(false)
      })
  }

  if (subscribers === null) {
    return <Loading />
  }

  // Table keys rows by `id`, while the API keys submissions by `submission_id`.
  const tableData = subscribers.map((subscriber) => ({
    ...subscriber,
    id: subscriber.submission_id,
    source: ATTRIBUTION_LABELS[subscriber.attribution_source] ?? 'Unknown',
    subscribed_on: new Date(subscriber.subscribed_at).toLocaleDateString(),
  }))

  return (
    <BaseCard title="Subscribers">
      <div className="mb-5">
        <p className="has-text-weight-semibold mb-1">Email list</p>
        <p className="is-size-7 has-text-grey mb-2">
          The same subscribers every time — pick the layout your mailing tool
          expects.
        </p>
        <div className="field has-addons">
          <div className="control">
            <div className="select is-small">
              <select
                value={exportFormat.key}
                onChange={(e) =>
                  setExportFormat(
                    EXPORT_FORMATS.find((f) => f.key === e.target.value) ??
                      EXPORT_FORMATS[0],
                  )
                }
              >
                {EXPORT_FORMATS.map((format) => (
                  <option key={format.key} value={format.key}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="control">
            <a
              className="button is-link is-small"
              href={getApiUrl(
                `/clubs/${club.code}/subscription-groups/${group.id}/export/emails/?fmt=${exportFormat.key}`,
              )}
            >
              <Icon name="download" alt="export" /> Download
            </a>
          </div>
        </div>
        <p className="is-size-7 has-text-grey">
          {exportFormat.help} Downloads as <code>{exportFormat.file}</code>.
        </p>

        <p className="has-text-weight-semibold mt-4 mb-1">Full responses</p>
        <p className="is-size-7 has-text-grey mb-2">
          Everything above plus one column per question, for reading what
          students actually wrote.
        </p>
        <div className="buttons">
          <a
            className="button is-success is-small"
            href={getApiUrl(
              `/clubs/${club.code}/subscription-groups/${group.id}/export/responses/?format=xlsx`,
            )}
          >
            <Icon name="download" alt="export" /> Excel
          </a>
          <a
            className="button is-light is-small"
            href={getApiUrl(
              `/clubs/${club.code}/subscription-groups/${group.id}/export/responses/?fmt=csv`,
            )}
          >
            <Icon name="download" alt="export" /> CSV
          </a>
        </div>
      </div>

      {subscribers.length === 0 ? (
        <Text>No subscribers yet.</Text>
      ) : (
        <TableScroll>
          <Table
            data={tableData}
            columns={[
              { name: 'name', label: 'Name' },
              { name: 'email', label: 'Email' },
              { name: 'graduation_year', label: 'Grad Year' },
              { name: 'source', label: 'Source' },
              { name: 'subscribed_on', label: 'Subscribed' },
            ]}
            searchableColumns={['name', 'email']}
            filterOptions={[
              {
                label: 'source',
                options: Object.entries(ATTRIBUTION_LABELS).map(
                  ([key, label]) => ({ key: label, label }),
                ),
                filterFunction: (selection, object) =>
                  object.source === selection,
              },
            ]}
            focusable={true}
            onClick={(row) => openDetail(row.original.submission_id)}
          />
        </TableScroll>
      )}

      {(detail || detailLoading) && (
        <Modal
          show={true}
          closeModal={() => {
            setDetail(null)
            setDetailLoading(false)
          }}
          width="600px"
          marginBottom={false}
        >
          <ModalContainer>
            {detailLoading || !detail ? (
              <Loading />
            ) : (
              <>
                <p className="title is-5 mb-1">{detail.name}</p>
                <p className="has-text-grey mb-1">{detail.email}</p>
                <p className="has-text-grey is-size-7 mb-4">
                  Subscribed via{' '}
                  {ATTRIBUTION_LABELS[detail.attribution_source] ?? 'Unknown'}{' '}
                  on {new Date(detail.subscribed_at).toLocaleDateString()}
                </p>
                {detail.responses.length === 0 ? (
                  <Text>No question responses recorded.</Text>
                ) : (
                  detail.responses.map((response) => (
                    <div key={response.question_id} className="mb-3">
                      <p className="has-text-weight-semibold">
                        {response.prompt}
                      </p>
                      <p>
                        {response.multiple_choice_value || response.text || '—'}
                      </p>
                    </div>
                  ))
                )}
              </>
            )}
          </ModalContainer>
        </Modal>
      )}
    </BaseCard>
  )
}

/* -------------------------------------------------------------------------- */
/* Distribution                                                                */
/* -------------------------------------------------------------------------- */

const DistributionTab = ({
  club,
  group,
}: {
  club: Club
  group: SubscriptionGroup
}): ReactElement<any> => {
  const [magicLink, setMagicLink] = useState<string | null>(null)
  const [autoSubscribe, setAutoSubscribe] = useState<boolean>(false)

  useEffect(() => {
    setMagicLink(null)
    doApiRequest(
      `/clubs/${club.code}/subscription-groups/${group.id}/magic-link/?format=json`,
    )
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((data) => {
        if (data) {
          setMagicLink(data.url)
          setAutoSubscribe(data.auto_subscribe_eligible)
        } else {
          toast.error('Failed to generate magic link.')
        }
      })
  }, [group.id])

  return (
    <>
      <BaseCard title="Magic Link">
        <Text>
          {autoSubscribe
            ? 'This form has no questions, so anyone opening this link is subscribed as soon as they sign in.'
            : 'Anyone opening this link is taken straight to this subscription form.'}
        </Text>
        {magicLink == null ? (
          <Loading />
        ) : (
          <div className="field has-addons">
            <div className="control is-expanded">
              <input className="input" readOnly value={magicLink} />
            </div>
            <div className="control">
              <button
                className="button is-primary"
                onClick={() => {
                  navigator.clipboard.writeText(magicLink)
                  toast.success('Link copied to clipboard.')
                }}
              >
                <Icon name="clipboard" alt="copy" /> Copy
              </button>
            </div>
          </div>
        )}
      </BaseCard>

      <QRCodeCard
        id={`${club.code}-subscription-${group.id}`}
        type={QRCodeType.SUBSCRIPTION}
        apiPath={`/clubs/${club.code}/subscription-groups/${group.id}/qr-code`}
      >
        <Text className="mt-3">
          Print this code on a flyer or show it at an activities fair. Scanning
          it opens the magic link above.
        </Text>
      </QRCodeCard>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const SubscriptionsPage = ({ club }: Props): ReactElement<any> => {
  const [groups, setGroups] = useState<SubscriptionGroup[] | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [innerTab, setInnerTab] = useState<InnerTab>('overview')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadGroups = () => {
    doApiRequest(`/clubs/${club.code}/subscription-groups/?format=json`)
      .then((resp) => resp.json())
      .then((data) => {
        setGroups(Array.isArray(data) ? data : (data.results ?? []))
      })
      .catch(() => {
        toast.error('Failed to load subscription forms.')
        setGroups([])
      })
  }

  useEffect(loadGroups, [])

  const handleCreate = async (values: {
    name: string
    description: string
    is_active: boolean
  }) => {
    const resp = await doApiRequest(
      `/clubs/${club.code}/subscription-groups/?format=json`,
      { method: 'POST', body: values },
    )
    if (resp.ok) {
      toast.success('Form created.')
      setShowCreateModal(false)
      loadGroups()
    } else {
      toast.error('Failed to create form.')
    }
  }

  if (groups === null) {
    return <Loading />
  }

  // Read the selection out of the freshly loaded list so the detail view keeps
  // showing current counts and flags after any mutation.
  const selected = groups.find((group) => group.id === selectedId) ?? null

  if (selected) {
    return (
      <div>
        <button
          className="button is-light is-small mb-3"
          onClick={() => setSelectedId(null)}
        >
          <Icon name="chevron-left" alt="back" /> All Forms
        </button>
        <StyledHeader>
          <span className="info">
            {selected.name}
            <StatusTags group={selected} />
          </span>
        </StyledHeader>

        <div className="tabs">
          <ul>
            {INNER_TABS.map((tab) => (
              <li
                key={tab.key}
                className={innerTab === tab.key ? 'is-active' : ''}
              >
                <a onClick={() => setInnerTab(tab.key)}>{tab.label}</a>
              </li>
            ))}
          </ul>
        </div>

        {innerTab === 'overview' && (
          <OverviewTab club={club} group={selected} onUpdated={loadGroups} />
        )}
        {innerTab === 'questions' && (
          <QuestionsTab club={club} group={selected} onUpdated={loadGroups} />
        )}
        {innerTab === 'subscribers' && (
          <SubscribersTab club={club} group={selected} />
        )}
        {innerTab === 'distribution' && (
          <DistributionTab club={club} group={selected} />
        )}
      </div>
    )
  }

  return (
    <div>
      <StyledHeader>
        <span className="info">Subscription Forms</span>
        <div className="tools">
          <button
            className="button is-primary is-small"
            onClick={() => setShowCreateModal(true)}
          >
            <Icon name="plus" alt="create" /> New Form
          </button>
        </div>
      </StyledHeader>

      {groups.length === 0 ? (
        <Text>
          No subscription forms yet. Create one to collect more than an email
          address when students subscribe.
        </Text>
      ) : (
        groups.map((group) => (
          <FormWrapper
            key={group.id}
            onClick={() => {
              setSelectedId(group.id)
              setInnerTab('overview')
            }}
          >
            <span className="has-text-weight-semibold">{group.name}</span>
            <StatusTags group={group} />
            <span className="is-pulled-right has-text-grey is-size-7">
              {group.question_count} questions · {group.subscriber_count}{' '}
              subscribers
              <Icon name="chevron-right" alt="open" style={{ marginLeft: 8 }} />
            </span>
          </FormWrapper>
        ))
      )}

      {showCreateModal && (
        <Modal
          show={showCreateModal}
          closeModal={() => setShowCreateModal(false)}
          width="500px"
          marginBottom={false}
        >
          <ModalContainer>
            <p className="title is-5 mb-3">New Subscription Form</p>
            <Formik
              initialValues={{ name: '', description: '', is_active: true }}
              onSubmit={handleCreate}
            >
              {({ isSubmitting }) => (
                <Form>
                  <Field name="name" label="Name" as={TextField} required />
                  <Field
                    name="description"
                    label="Description"
                    as={TextField}
                  />
                  <Field
                    name="is_active"
                    label="Active immediately"
                    as={CheckboxField}
                  />
                  <button
                    type="submit"
                    className="button is-primary mt-2"
                    disabled={isSubmitting}
                  >
                    Create
                  </button>
                </Form>
              )}
            </Formik>
          </ModalContainer>
        </Modal>
      )}
    </div>
  )
}

export default SubscriptionsPage
