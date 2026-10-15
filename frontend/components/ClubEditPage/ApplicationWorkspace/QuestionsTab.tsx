import moment from 'moment-timezone'
import { ReactElement, useEffect, useRef, useState } from 'react'
import Select from 'react-select'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { Icon, Loading, Modal } from '~/components/common'
import {
  ALLBIRDS_GRAY,
  CLUBS_BLUE,
  CLUBS_GREY,
  MD,
  mediaMaxWidth,
  MEDIUM_GRAY,
} from '~/constants'
import {
  ApplicationChoice,
  ApplicationQuestion,
  ApplicationQuestionType,
  ApplicationSection,
} from '~/types'
import { doApiRequest } from '~/utils'

import { GoogleFormImport } from '../Google'
import {
  Muted,
  Panel,
  questionsUrl,
  useConfirm,
  WorkspaceApplication,
} from './shared'

// text blocks are added with "Add title and description", not picked here
const QUESTION_TYPES = [
  { value: ApplicationQuestionType.ShortAnswer, label: 'Short answer' },
  { value: ApplicationQuestionType.FreeResponse, label: 'Paragraph' },
  { value: ApplicationQuestionType.MultipleChoice, label: 'Multiple choice' },
  { value: ApplicationQuestionType.Checkbox, label: 'Checkboxes' },
]

// the prompt picker and essay most club applications use, ready to edit
const PERSONAL_STATEMENT = [
  {
    question_type: ApplicationQuestionType.MultipleChoice,
    prompt: 'Choose one of the following prompts for your personal statement',
    multiple_choice: [
      'Tell us about a time you took initiative or demonstrated leadership',
      'Tell us about a time you faced a challenge and how you solved it',
      'Tell us about a time you collaborated well in a team',
    ].map((value) => ({ value })),
  },
  {
    question_type: ApplicationQuestionType.FreeResponse,
    prompt: 'Answer the prompt you selected',
    // eslint-disable-next-line camelcase
    word_limit: 150,
  },
]

const hasOptions = (type: ApplicationQuestionType) =>
  type === ApplicationQuestionType.MultipleChoice ||
  type === ApplicationQuestionType.Checkbox

const Card = styled(Panel)`
  border-left: 4px solid rgba(73, 84, 244, 0.2);
  transition: border-color 0.15s;

  &:focus-within {
    border-left-color: ${CLUBS_BLUE};
  }
`

// the card that opens a section, like a section header in Google Forms
const SectionCard = styled(Panel)`
  border-top: 3px solid rgba(73, 84, 244, 0.4);
  margin-top: 40px;
`

// inputs that look like text until you click into them, like Google Forms
const InlineInput = styled.input<{ $size?: 'large' | 'title' }>`
  width: 100%;
  border: none;
  border-bottom: 1px solid transparent;
  padding: 6px 0;
  font-size: ${({ $size }) =>
    $size === 'title' ? '1.5rem' : $size === 'large' ? '1.1rem' : '0.95rem'};
  font-weight: ${({ $size }) => ($size ? 600 : 400)};
  background: transparent;
  outline: none;

  &:hover {
    border-bottom-color: ${ALLBIRDS_GRAY};
  }

  &:focus {
    border-bottom: 2px solid ${CLUBS_BLUE};
  }
`

const InlineTextarea = styled.textarea`
  width: 100%;
  border: none;
  border-bottom: 1px solid transparent;
  padding: 6px 0;
  font: inherit;
  font-size: 0.95rem;
  background: transparent;
  outline: none;
  resize: none;

  &:hover {
    border-bottom-color: ${ALLBIRDS_GRAY};
  }

  &:focus {
    border-bottom: 2px solid ${CLUBS_BLUE};
  }
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const Footer = styled(Row)`
  flex-wrap: wrap;
  justify-content: flex-end;
  border-top: 1px solid ${ALLBIRDS_GRAY};
  margin-top: 16px;
  padding-top: 12px;
`

const Between = styled(Row)`
  justify-content: space-between;
`

// the empty circle or square shown next to each option
const OptionMark = styled.span<{ $square: boolean }>`
  flex: none;
  width: 16px;
  height: 16px;
  border: 2px solid ${MEDIUM_GRAY};
  border-radius: ${({ $square }) => ($square ? '3px' : '50%')};
`

const IconButton = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  color: ${MEDIUM_GRAY};
  padding: 4px;

  &:hover:not(:disabled) {
    color: ${CLUBS_BLUE};
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`

// the questions, with a toolbar beside them like the one in Google Forms
const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 76px;
  gap: 12px;
  align-items: start;

  ${mediaMaxWidth(MD)} {
    grid-template-columns: 1fr;
  }
`

const Toolbar = styled.div`
  position: sticky;
  top: 90px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  background: #fff;
  border: 1px solid ${ALLBIRDS_GRAY};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 4px;
    border: none;
    border-radius: 6px;
    background: none;
    color: ${CLUBS_GREY};
    font-size: 0.7rem;
    cursor: pointer;
  }

  button:hover {
    background: #eef0fe;
    color: ${CLUBS_BLUE};
  }

  .where {
    padding: 6px 2px 2px;
    border-top: 1px solid ${ALLBIRDS_GRAY};
    color: ${MEDIUM_GRAY};
    font-size: 0.65rem;
    text-align: center;
  }

  ${mediaMaxWidth(MD)} {
    position: static;
    flex-direction: row;
    order: -1;
  }
`

const MenuWrap = styled.div`
  position: relative;
`

const MenuList = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 20;
  min-width: 260px;
  padding: 6px 0;
  background: #fff;
  border: 1px solid ${ALLBIRDS_GRAY};
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);

  button {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 14px;
    border: none;
    background: none;
    text-align: left;
    font-size: 0.9rem;
    cursor: pointer;
  }

  button:hover {
    background: #f5f6fa;
  }

  .check {
    width: 16px;
    color: ${CLUBS_BLUE};
  }

  .heading {
    padding: 8px 14px 4px;
    color: ${MEDIUM_GRAY};
    font-size: 0.75rem;
  }
`

type MenuItem =
  | { label: string; checked: boolean; onClick: () => void }
  | { heading: string }

// the "more options" menu on a question, like Google Forms' three dots
const MoreMenu = ({ items }: { items: MenuItem[] }): ReactElement => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <MenuWrap ref={ref}>
      <IconButton title="More options" onClick={() => setOpen(!open)}>
        <Icon name="more-horizontal" alt="more options" />
      </IconButton>
      {open && (
        <MenuList>
          {items.map((item, index) =>
            'heading' in item ? (
              <div className="heading" key={index}>
                {item.heading}
              </div>
            ) : (
              <button
                key={index}
                onClick={() => {
                  item.onClick()
                  setOpen(false)
                }}
              >
                <span className="check">
                  {item.checked && <Icon name="check" alt="" />}
                </span>
                {item.label}
              </button>
            ),
          )}
        </MenuList>
      )}
    </MenuWrap>
  )
}

type Changes = { [key: string]: any }

// placeholder text gets highlighted on click, so typing replaces it at once
const DEFAULT_TEXT = /^(Option \d+|Untitled( question| section| application)?)$/
const selectDefault = (e: React.FocusEvent<HTMLInputElement>) => {
  if (DEFAULT_TEXT.test(e.target.value)) {
    e.target.select()
  }
}

// "Section 2 (Engineering)", for menus that pick a section
const sectionName = (sections: ApplicationSection[], id: number | null) => {
  if (id === null) {
    return 'Section 1'
  }
  const index = sections.findIndex((section) => section.id === id)
  const title = sections[index]?.title
  return `Section ${index + 2}${title ? ` (${title})` : ''}`
}

// where an option or section leads, as one value for a dropdown
const destination = (target: {
  go_to_section?: number | null
  next_section?: number | null
  ends_application?: boolean
}) =>
  target.ends_application
    ? 'end'
    : String(target.go_to_section ?? target.next_section ?? '')

const DestinationSelect = ({
  value,
  sections,
  allSections,
  onChange,
}: {
  value: string
  // the sections it can lead to
  sections: ApplicationSection[]
  // every section, for numbering them
  allSections: ApplicationSection[]
  onChange: (value: string) => void
}): ReactElement => (
  <div className="select is-small">
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Continue to next section</option>
      {sections.map((section) => (
        <option key={section.id} value={section.id}>
          Go to {sectionName(allSections, section.id)}
        </option>
      ))}
      <option value="end">Submit form</option>
    </select>
  </div>
)

const QuestionCard = ({
  question,
  sections,
  legacyCommittees,
  isFirst,
  isLast,
  onSave,
  onMove,
  onDelete,
}: {
  question: ApplicationQuestion
  sections: ApplicationSection[]
  // committees chosen from the old dropdown, when no question picks them
  legacyCommittees: string[]
  isFirst: boolean
  isLast: boolean
  onSave: (changes: Changes) => void
  onMove: (delta: number) => void
  onDelete: () => void
}): ReactElement => {
  const [prompt, setPrompt] = useState(question.prompt)
  const [description, setDescription] = useState(question.description ?? '')
  const [wordLimit, setWordLimit] = useState(question.word_limit)
  const [options, setOptions] = useState<ApplicationChoice[]>(
    question.multiple_choice,
  )
  const isText = question.question_type === ApplicationQuestionType.InfoText
  const isChoice =
    question.question_type === ApplicationQuestionType.MultipleChoice

  const saveOptions = (values: ApplicationChoice[]) => {
    setOptions(values)
    onSave({ multiple_choice: values })
  }

  return (
    <Card>
      <Row>
        <InlineInput
          onFocus={selectDefault}
          $size="large"
          value={prompt}
          placeholder={isText ? 'Title' : 'Question'}
          onChange={(e) => setPrompt(e.target.value)}
          onBlur={() => prompt !== question.prompt && onSave({ prompt })}
        />
        {!isText && (
          <div className="select">
            <select
              value={question.question_type}
              onChange={(e) => {
                const type = Number(e.target.value)
                // a new choice question starts with one option to edit
                if (hasOptions(type) && options.length === 0) {
                  setOptions([{ value: 'Option 1' }])
                  onSave({
                    question_type: type,
                    multiple_choice: [{ value: 'Option 1' }],
                  })
                } else {
                  onSave({ question_type: type })
                }
              }}
            >
              {QUESTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </Row>
      <InlineTextarea
        value={description}
        rows={Math.max(1, description.split('\n').length)}
        placeholder="Description (optional)"
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() =>
          description !== (question.description ?? '') &&
          onSave({ description })
        }
      />

      <div className="mt-3">
        {question.question_type === ApplicationQuestionType.ShortAnswer && (
          <Muted>Short answer text</Muted>
        )}
        {question.question_type === ApplicationQuestionType.FreeResponse && (
          <Row>
            <Muted>Word limit</Muted>
            <input
              className="input is-small"
              type="number"
              min={0}
              style={{ width: 90 }}
              value={wordLimit}
              onChange={(e) => setWordLimit(Number(e.target.value))}
              onBlur={() =>
                wordLimit !== question.word_limit &&
                onSave({ word_limit: wordLimit })
              }
            />
            <Muted>0 means no limit</Muted>
          </Row>
        )}
        {hasOptions(question.question_type) &&
          options.map((option, index) => (
            <Row key={index}>
              <OptionMark
                $square={
                  question.question_type === ApplicationQuestionType.Checkbox
                }
              />
              <InlineInput
                onFocus={selectDefault}
                value={option.value}
                onChange={(e) =>
                  setOptions(
                    options.map((other, i) =>
                      i === index ? { ...other, value: e.target.value } : other,
                    ),
                  )
                }
                onBlur={() =>
                  option.value !== question.multiple_choice[index]?.value &&
                  saveOptions(options)
                }
              />
              {isChoice && question.routes && (
                <DestinationSelect
                  value={destination(option)}
                  sections={sections}
                  allSections={sections}
                  onChange={(value) =>
                    saveOptions(
                      options.map((other, i) =>
                        i === index
                          ? {
                              ...other,
                              // eslint-disable-next-line camelcase
                              go_to_section:
                                value && value !== 'end' ? Number(value) : null,
                              // eslint-disable-next-line camelcase
                              ends_application: value === 'end',
                            }
                          : other,
                      ),
                    )
                  }
                />
              )}
              <IconButton
                title="Remove option"
                disabled={options.length === 1}
                onClick={() =>
                  saveOptions(options.filter((_, i) => i !== index))
                }
              >
                <Icon name="x" alt="remove option" />
              </IconButton>
            </Row>
          ))}
        {hasOptions(question.question_type) && (
          <button
            className="button is-small is-text mt-1"
            onClick={() =>
              saveOptions([
                ...options,
                { value: `Option ${options.length + 1}` },
              ])
            }
          >
            Add option
          </button>
        )}
      </div>

      <Footer>
        {legacyCommittees.length > 0 && (
          <div style={{ minWidth: 240, marginRight: 'auto' }}>
            <Select
              isMulti
              placeholder="Shown to every committee"
              options={legacyCommittees.map((name) => ({
                label: name,
                value: name,
              }))}
              value={(question.committee_question
                ? question.committees
                : []
              ).map(({ name }) => ({ label: name, value: name }))}
              onChange={(selected) =>
                onSave({
                  committee_question: selected.length > 0,
                  committees: selected.map(({ value }) => ({ name: value })),
                })
              }
            />
          </div>
        )}
        {!isText && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onSave({ required: e.target.checked })}
            />{' '}
            Required
          </label>
        )}
        {(isChoice || sections.length > 0) && (
          <MoreMenu
            items={[
              ...(isChoice
                ? [
                    {
                      label: 'Go to section based on answer',
                      checked: question.routes,
                      onClick: () =>
                        onSave(
                          question.routes
                            ? // eslint-disable-next-line camelcase
                              { routes: false, committee_routing: false }
                            : { routes: true },
                        ),
                    },
                  ]
                : []),
              ...(isChoice && question.routes
                ? [
                    {
                      label: 'Use answers as committees',
                      checked: question.committee_routing,
                      onClick: () =>
                        // eslint-disable-next-line camelcase
                        onSave({
                          committee_routing: !question.committee_routing,
                        }),
                    },
                  ]
                : []),
              ...(sections.length > 0
                ? [
                    { heading: 'Move to' },
                    ...[null, ...sections.map(({ id }) => id)].map((id) => ({
                      label: sectionName(sections, id),
                      checked: (question.section ?? null) === id,
                      onClick: () => onSave({ section: id }),
                    })),
                  ]
                : []),
            ]}
          />
        )}
        <IconButton
          title="Move up"
          disabled={isFirst}
          onClick={() => onMove(-1)}
        >
          <Icon name="chevron-up" alt="move up" />
        </IconButton>
        <IconButton
          title="Move down"
          disabled={isLast}
          onClick={() => onMove(1)}
        >
          <Icon name="chevron-down" alt="move down" />
        </IconButton>
        <IconButton title="Delete" onClick={onDelete}>
          <Icon name="trash" alt="delete" />
        </IconButton>
      </Footer>
    </Card>
  )
}

// a section's title and description, saved when you click away
const SectionFields = ({
  section,
  onSave,
}: {
  section: ApplicationSection
  onSave: (changes: Changes) => void
}): ReactElement => {
  const [title, setTitle] = useState(section.title)
  const [description, setDescription] = useState(section.description)
  return (
    <>
      <InlineInput
        onFocus={selectDefault}
        $size="title"
        value={title}
        placeholder="Section title"
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title !== section.title && onSave({ title })}
      />
      <InlineTextarea
        value={description}
        rows={Math.max(1, description.split('\n').length)}
        placeholder="Description (optional)"
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() =>
          description !== section.description && onSave({ description })
        }
      />
    </>
  )
}

export default function QuestionsTab({
  clubCode,
  application,
  onApplicationChanged,
}: {
  clubCode: string
  application: WorkspaceApplication
  onApplicationChanged: () => void
}): ReactElement {
  const [questions, setQuestions] = useState<ApplicationQuestion[] | null>(null)
  const [sections, setSections] = useState<ApplicationSection[]>([])
  const [name, setName] = useState(application.name)
  const [showImport, setShowImport] = useState(false)
  // the section the toolbar adds to: the one last clicked or typed in
  const [active, setActive] = useState<number | null>(null)
  const [confirmDialog, confirm] = useConfirm()
  const appUrl = `/clubs/${clubCode}/applications/${application.id}/`
  const url = questionsUrl(clubCode, application.id)

  const load = () =>
    Promise.all([
      doApiRequest(`${url}?format=json`).then((resp) => resp.json()),
      doApiRequest(`${appUrl}sections/?format=json`).then((resp) =>
        resp.json(),
      ),
    ]).then(([loadedQuestions, loadedSections]) => {
      setQuestions(loadedQuestions)
      setSections(loadedSections)
    })

  useEffect(() => {
    load()
  }, [url])

  const showError = async (resp: Response) => {
    const data = await resp.json().catch(() => null)
    toast.error(
      data?.detail ??
        (data && Object.values(data).flat().join(' ')) ??
        'Could not save that change.',
    )
  }

  const save = async (question: ApplicationQuestion, changes: Changes) => {
    const resp = await doApiRequest(`${url}${question.id}/?format=json`, {
      method: 'PATCH',
      body: changes,
    })
    if (!resp.ok) {
      return showError(resp)
    }
    const saved: ApplicationQuestion = await resp.json()
    setQuestions((current) =>
      (current ?? []).map((other) =>
        other.id === saved.id
          ? saved
          : // only one question can pick the committee
            {
              ...other,
              // eslint-disable-next-line camelcase
              committee_routing: saved.committee_routing
                ? false
                : other.committee_routing,
            },
      ),
    )
    // a committee question's options are the application's committees
    if (saved.committee_routing || 'committee_routing' in changes) {
      onApplicationChanged()
    }
  }

  // adds questions to the end of a section, blank unless given starting points
  const add = async (
    section: number | null,
    starts: Changes[] = [{}],
  ): Promise<void> => {
    let precedence = questions?.[questions.length - 1]?.precedence ?? 0
    const created: ApplicationQuestion[] = []
    for (const start of starts) {
      const resp = await doApiRequest(`${url}?format=json`, {
        method: 'POST',
        body: {
          question_type: ApplicationQuestionType.ShortAnswer,
          prompt: 'Untitled question',
          precedence: ++precedence,
          section,
          ...start,
        },
      })
      if (!resp.ok) {
        showError(resp)
        break
      }
      created.push(await resp.json())
    }
    setQuestions([...(questions ?? []), ...created])
  }

  const remove = async (question: ApplicationQuestion) => {
    const confirmed = await confirm({
      title: 'Delete this question?',
      message: 'Any answers applicants gave to it will be deleted too.',
      confirmLabel: 'Delete question',
    })
    if (!confirmed) {
      return
    }
    const resp = await doApiRequest(`${url}${question.id}/?format=json`, {
      method: 'DELETE',
    })
    if (!resp.ok) {
      return showError(resp)
    }
    setQuestions((questions ?? []).filter(({ id }) => id !== question.id))
  }

  // swaps a question with its neighbor in the same section
  const move = (list: ApplicationQuestion[], id: number, delta: number) => {
    const neighbor = list[list.findIndex((q) => q.id === id) + delta]
    const reordered = [...(questions ?? [])]
    const from = reordered.findIndex((q) => q.id === id)
    const to = reordered.findIndex((q) => q.id === neighbor.id)
    ;[reordered[from], reordered[to]] = [reordered[to], reordered[from]]
    setQuestions(reordered)
    doApiRequest(`${url}precedence/?format=json`, {
      method: 'POST',
      body: { precedence: reordered.map(({ id }) => id) },
    })
  }

  const saveSection = async (section: ApplicationSection, changes: Changes) => {
    const resp = await doApiRequest(
      `${appUrl}sections/${section.id}/?format=json`,
      { method: 'PATCH', body: changes },
    )
    if (!resp.ok) {
      return showError(resp)
    }
    const saved = await resp.json()
    setSections((current) =>
      current.map((other) => (other.id === saved.id ? saved : other)),
    )
  }

  const addSection = async () => {
    const resp = await doApiRequest(`${appUrl}sections/?format=json`, {
      method: 'POST',
      body: {
        title: 'Untitled section',
        precedence: (sections[sections.length - 1]?.precedence ?? 0) + 1,
      },
    })
    if (!resp.ok) {
      return showError(resp)
    }
    const created = await resp.json()
    setSections([...sections, created])
    setActive(created.id)
  }

  const removeSection = async (section: ApplicationSection) => {
    const count = (questions ?? []).filter(
      (question) => question.section === section.id,
    ).length
    const confirmed = await confirm({
      title: `Delete ${sectionName(sections, section.id)}?`,
      message:
        count > 0
          ? `Its ${count} question${count === 1 ? '' : 's'} and their answers are deleted too.`
          : 'This section has no questions.',
      confirmLabel: 'Delete section',
    })
    if (!confirmed) {
      return
    }
    const resp = await doApiRequest(
      `${appUrl}sections/${section.id}/?format=json`,
      { method: 'DELETE' },
    )
    if (!resp.ok) {
      return showError(resp)
    }
    load()
  }

  // sections trade places by swapping their order numbers
  const moveSection = (index: number, delta: number) => {
    const [a, b] = [sections[index], sections[index + delta]]
    const reordered = [...sections]
    reordered[index] = { ...b, precedence: a.precedence }
    reordered[index + delta] = { ...a, precedence: b.precedence }
    setSections(reordered)
    saveSection(a, { precedence: b.precedence })
    saveSection(b, { precedence: a.precedence })
  }

  const saveName = async () => {
    if (name === application.name) {
      return
    }
    const resp = await doApiRequest(`${appUrl}?format=json`, {
      method: 'PATCH',
      body: { name },
    })
    if (!resp.ok) {
      return showError(resp)
    }
    onApplicationChanged()
  }

  if (questions === null) {
    return <Loading />
  }

  // committees picked from the old dropdown, when no question picks them
  const legacyCommittees = questions.some((q) => q.committee_routing)
    ? []
    : (application.committees ?? []).map((committee) => committee.name)
  const total = sections.length + 1
  const committeesLocked = moment(application.application_start_time).isBefore(
    moment(),
  )

  const cards = (section: number | null) => {
    const list = questions.filter((question) => question.section === section)
    return list.map((question, index) => (
      <QuestionCard
        key={question.id}
        question={question}
        sections={sections}
        legacyCommittees={legacyCommittees}
        isFirst={index === 0}
        isLast={index === list.length - 1}
        onSave={(changes) => save(question, changes)}
        onMove={(delta) => move(list, question.id, delta)}
        onDelete={() => remove(question)}
      />
    ))
  }

  const target = sections.some(({ id }) => id === active) ? active : null
  // a section's cards; clicking or typing in it points the toolbar at it
  const sectionArea = (section: number | null) => ({
    onFocusCapture: () => setActive(section),
    onMouseDownCapture: () => setActive(section),
  })

  return (
    <Layout>
      <div style={{ minWidth: 0 }}>
        <Muted as="p" className="mb-4">
          {questions.length === 0
            ? 'No questions yet. Add one with the toolbar, or import a Google Form.'
            : `${questions.length} question${questions.length === 1 ? '' : 's'}, changes save automatically`}
        </Muted>

        <div {...sectionArea(null)}>
          <SectionCard style={{ marginTop: 0 }}>
            {total > 1 && <Muted>Section 1 of {total}</Muted>}
            <InlineInput
              onFocus={selectDefault}
              $size="title"
              value={name}
              placeholder="Application name"
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
            />
          </SectionCard>
          {cards(null)}
        </div>

        {sections.map((section, index) => (
          <div key={section.id} {...sectionArea(section.id)}>
            <SectionCard>
              <Between>
                <Muted>
                  Section {index + 2} of {total}
                </Muted>
                <Row>
                  <IconButton
                    title="Move section up"
                    disabled={index === 0}
                    onClick={() => moveSection(index, -1)}
                  >
                    <Icon name="chevron-up" alt="move section up" />
                  </IconButton>
                  <IconButton
                    title="Move section down"
                    disabled={index === sections.length - 1}
                    onClick={() => moveSection(index, 1)}
                  >
                    <Icon name="chevron-down" alt="move section down" />
                  </IconButton>
                  <IconButton
                    title="Delete section"
                    onClick={() => removeSection(section)}
                  >
                    <Icon name="trash" alt="delete section" />
                  </IconButton>
                </Row>
              </Between>
              <SectionFields
                section={section}
                onSave={(changes) => saveSection(section, changes)}
              />
            </SectionCard>
            {cards(section.id)}
            <Row className="mb-4">
              <Muted>After section {index + 2}</Muted>
              <DestinationSelect
                value={destination(section)}
                sections={sections.filter((other) => other.id !== section.id)}
                allSections={sections}
                onChange={(value) =>
                  saveSection(section, {
                    // eslint-disable-next-line camelcase
                    next_section:
                      value && value !== 'end' ? Number(value) : null,
                    // eslint-disable-next-line camelcase
                    ends_application: value === 'end',
                  })
                }
              />
            </Row>
          </div>
        ))}

        {committeesLocked && questions.some((q) => q.committee_routing) && (
          <p className="mt-3">
            <Muted>
              The committee options can't change now that the application is
              open.
            </Muted>
          </p>
        )}
      </div>

      <Toolbar>
        <button title="Add a question" onClick={() => add(target)}>
          <Icon name="plus" alt="" size="1.1rem" />
          Question
        </button>
        <button
          title="Add a title and description"
          onClick={() =>
            add(target, [
              { question_type: ApplicationQuestionType.InfoText, prompt: '' },
            ])
          }
        >
          <Icon name="list" alt="" size="1.1rem" />
          Text
        </button>
        <button
          title="Add a personal statement prompt and essay"
          onClick={() => add(target, PERSONAL_STATEMENT)}
        >
          <Icon name="edit" alt="" size="1.1rem" />
          Statement
        </button>
        <button title="Add a section" onClick={addSection}>
          <Icon name="grid" alt="" size="1.1rem" />
          Section
        </button>
        <button
          title="Import questions from a Google Form"
          onClick={() => setShowImport(true)}
        >
          <Icon name="upload" alt="" size="1.1rem" />
          Import
        </button>
        {sections.length > 0 && (
          <div className="where">
            Adds to section{' '}
            {target === null
              ? 1
              : sections.findIndex(({ id }) => id === target) + 2}
          </div>
        )}
      </Toolbar>

      {confirmDialog}
      {showImport && (
        <Modal
          show
          closeModal={() => setShowImport(false)}
          width="60%"
          marginBottom={false}
        >
          <GoogleFormImport
            clubCode={clubCode}
            applicationId={application.id}
            onImported={load}
          />
        </Modal>
      )}
    </Layout>
  )
}
