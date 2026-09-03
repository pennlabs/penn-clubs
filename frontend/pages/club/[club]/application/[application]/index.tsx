import 'moment-timezone'

import ClubMetadata from 'components/ClubMetadata'
import { Container, Icon, Title } from 'components/common'
import { Field, Form, Formik } from 'formik'
import moment from 'moment'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type JSX, ReactElement, useRef, useState } from 'react'
import TimeAgo from 'react-timeago'
import renderPage from 'renderPage'
import styled from 'styled-components'
import {
  Application,
  ApplicationQuestion,
  ApplicationQuestionType,
  Club,
} from 'types'
import { doApiRequest } from 'utils'

import AuthPrompt from '~/components/common/AuthPrompt'
import { SelectField, TextField } from '~/components/FormComponents'

type ApplicationPageProps = {
  club: Club
  application: Application
  questions: ApplicationQuestion[]
  initialValues: any
}

const SubmitNotificationSpan = styled.span`
  position: relative;
  top: 0.5em;
  left: 1em;
`

/**
 * Prefills the form with the responses already stored for this user.
 *
 * Responses live on a submission and a user may hold one per committee, so the
 * committee has to be part of the lookup — without it the server answers with
 * whichever submission it finds first, which shows one committee's answers
 * while you are editing another. `question_ids` asks for the whole form in a
 * single request so switching committees is one round trip, not one per
 * question.
 */
export async function fetchResponses(
  questions: ApplicationQuestion[],
  committee: string | null,
  requestData?: { headers?: any },
): Promise<{ [id: number]: any }> {
  const ids = questions.map((question) => question.id)
  if (ids.length === 0) {
    return {}
  }
  const params = new URLSearchParams({
    format: 'json',
    question_ids: ids.join(','),
  })
  if (committee != null) {
    params.set('committee', committee)
  }
  const payloads = await (
    await doApiRequest(`/users/questions/?${params.toString()}`, requestData)
  ).json()

  const values: { [id: number]: any } = {}
  if (!Array.isArray(payloads)) {
    return values
  }
  payloads.forEach((payload) => {
    const id = payload?.question?.id
    if (id == null) {
      return
    }
    switch (parseInt(payload.question_type)) {
      case ApplicationQuestionType.FreeResponse:
      case ApplicationQuestionType.ShortAnswer:
        values[id] = payload.text
        break
      case ApplicationQuestionType.MultipleChoice:
        values[id] =
          payload.multiple_choice !== null
            ? payload.multiple_choice.value
            : null
        break
      default:
        break
    }
  })
  return values
}

export function computeWordCount(input: string): number {
  return input !== undefined
    ? input.split(' ').filter((word) => word !== '').length
    : 0
}

export function formatQuestionType(
  props: any,
  question: ApplicationQuestion,
  wordCounts: { id?: number },
  setWordCounts: (val: any) => void,
  readOnly: boolean,
): JSX.Element {
  switch (question.question_type) {
    case ApplicationQuestionType.FreeResponse:
      return (
        <>
          <Field
            name={question.id}
            label={question.prompt}
            onInput={(event) => {
              const wordCount = computeWordCount(event.target.value)
              wordCounts[question.id] = wordCount
              setWordCounts(wordCounts)
            }}
            as={TextField}
            type={'textarea'}
            helpText={`Word count: ${wordCounts[question.id]}/${
              question.word_limit
            }`}
            readOnly={readOnly}
          />
        </>
      )
    case ApplicationQuestionType.MultipleChoice:
      return readOnly ? (
        <Field
          name={question.id}
          label={question.prompt}
          as={TextField}
          readOnly={readOnly}
        />
      ) : (
        <Field
          name={question.id}
          label={question.prompt}
          as={SelectField}
          choices={question.multiple_choice.map((choice) => {
            return {
              label: choice.value,
              value: choice.value,
            }
          })}
        />
      )
    case ApplicationQuestionType.InfoText:
      return (
        <>
          <b>{question.prompt}</b>
          <br></br>
        </>
      )
    default:
      return (
        <Field
          name={question.id}
          label={question.prompt}
          as={TextField}
          readOnly={readOnly}
        />
      )
  }
}

const ApplicationPage = ({
  userInfo,
  club,
  application,
  questions,
  initialValues,
}): ReactElement<any> => {
  const router = useRouter()
  const [redirected, setRedirected] = useState<boolean>(false)

  // Return null during redirection to prevent flashing of content
  if (!userInfo) {
    return <AuthPrompt />
  } else if (club.detail) {
    return (
      <Container paddingTop>
        <Title>Club Not Found</Title>
        <p>
          Back to <Link href="/">Home</Link>.
        </p>
      </Container>
    )
  } else if (application.detail) {
    return (
      <Container paddingTop>
        <Title>Application Not Found</Title>
        <p>
          Back to <Link href={`/club/${club.code}`}>{club.name}</Link>.
        </p>
      </Container>
    )
  }

  // Second condition will be replaced with perms check or question nullity check once backend is updated
  // eslint-disable-next-line no-constant-condition
  if (new Date() < new Date(application.application_start_time) && false) {
    return (
      <Container paddingTop>
        <Title>Application Not Open</Title>
        <p>
          This application is not open yet. Please check back{' '}
          <TimeAgo date={application.application_start_time} />.
        </p>
      </Container>
    )
  }

  const [errors, setErrors] = useState<string | null>(null)
  const [saved, setSaved] = useState<boolean>(false)
  // A ?committee= in the URL preselects that committee, so a link from the
  // applications tab opens straight onto the submission it belongs to rather
  // than making the applicant find it in the dropdown again.
  const requestedCommittee = Array.isArray(router.query.committee)
    ? router.query.committee[0]
    : router.query.committee
  const preselected =
    requestedCommittee != null &&
    application?.committees?.some(
      (committee) => committee.name === requestedCommittee,
    )
      ? { label: requestedCommittee, value: requestedCommittee }
      : null
  const [currentCommittee, setCurrentCommittee] = useState<{
    label: string
    value: string
  } | null>(preselected)

  const countWords = (responses: { [id: number]: any }): { id?: number } => {
    const counts: { id?: number } = {}
    questions.forEach((question) => {
      if (question.question_type === ApplicationQuestionType.FreeResponse) {
        counts[question.id] = computeWordCount(responses[question.id])
      }
    })
    return counts
  }

  // Answers belong to a committee's submission, so the form has to be refilled
  // when the committee changes; keeping the values in state lets Formik
  // reinitialize instead of showing the previous committee's answers.
  const [formValues, setFormValues] = useState<{ [id: number]: any }>(
    initialValues,
  )
  const [wordCounts, setWordCounts] = useState<{ id?: number }>(
    countWords(initialValues),
  )

  // Answers belong to one committee's submission. Switching committees swaps
  // the whole form, so the answers on screen have to go the moment the
  // committee does: leaving them up means the previous committee's text is
  // visible, and submittable, under the new one. Only the newest request may
  // fill the form, or switching quickly can land an older reply last.
  const [loadingResponses, setLoadingResponses] = useState<boolean>(false)
  const committeeRequest = useRef<number>(0)

  const selectCommittee = (committee: { label: string; value: string }) => {
    const request = committeeRequest.current + 1
    committeeRequest.current = request

    setCurrentCommittee(committee)
    setSaved(false)
    setFormValues({})
    setWordCounts(countWords({}))
    setLoadingResponses(true)

    fetchResponses(questions, committee?.value ?? null)
      .then((responses) => {
        if (committeeRequest.current !== request) {
          return
        }
        setFormValues(responses)
        setWordCounts(countWords(responses))
      })
      .finally(() => {
        // without this a failed fetch leaves Submit disabled for good
        if (committeeRequest.current === request) {
          setLoadingResponses(false)
        }
      })
  }

  const committees = application?.committees
  // `questions` stays whole so a committee switch can refill every answer the
  // user has; only what is rendered and submitted is narrowed
  const visibleQuestions = questions.filter((question) => {
    if (!question.committee_question) {
      // render all non-committee questions
      return true
    } else if (currentCommittee === undefined || currentCommittee === null) {
      // committee not yet picked, don't render any committee questions
      return false
    } else {
      // committee is picked, only render questions which pertain to the selected committee
      return (
        question.committees
          .map((committee) => committee.name)
          .indexOf(currentCommittee.value) !== -1
      )
    }
  })

  return (
    <>
      <ClubMetadata club={club} />
      <Container paddingTop>
        <div className="is-clearfix">
          <div className="is-pulled-left">
            <Title>{application.name}</Title>
          </div>
        </div>
        {application.description != null && application.description !== '' && (
          <>
            <div
              dangerouslySetInnerHTML={{
                __html: application.description,
              }}
            ></div>
          </>
        )}
        {application.application_end_time != null &&
          moment(application.application_end_time).isValid() && (
            <small className="is-block mt-2">
              <b>
                Due:{' '}
                {moment(application.application_end_time).format(
                  'dddd, MMMM D, YYYY [at] h:mm A [ET]',
                )}
              </b>
            </small>
          )}
        <hr />
        <Formik
          initialValues={formValues}
          enableReinitialize
          onSubmit={(values: { [id: number]: any }, actions) => {
            let submitErrors: string | null = null

            // word count error check
            for (const [questionId, text] of Object.entries(values)) {
              const question = visibleQuestions.find(
                (question: ApplicationQuestion) =>
                  question.id === parseInt(questionId),
              )
              if (
                question !== undefined &&
                question.question_type ===
                  ApplicationQuestionType.FreeResponse &&
                computeWordCount(text) > question.word_limit
              ) {
                submitErrors = 'One of your responses exceeds the word limit!'
              }
            }

            if (submitErrors === null) {
              const body: any = { questionIds: [] }
              for (const [questionId, text] of Object.entries(values).filter(
                (value) => value[0] !== 'undefined',
              )) {
                body.questionIds.push(questionId)
                if (currentCommittee != null) {
                  body.committee = currentCommittee.value
                }
                const question = visibleQuestions.find(
                  (question: ApplicationQuestion) =>
                    question.id === parseInt(questionId),
                )
                if (
                  question != null &&
                  question.question_type === ApplicationQuestionType.InfoText
                ) {
                  continue
                }

                switch (question?.question_type) {
                  case ApplicationQuestionType.FreeResponse:
                  case ApplicationQuestionType.ShortAnswer:
                    body[questionId] = {
                      text,
                    }
                    break
                  case ApplicationQuestionType.MultipleChoice:
                    body[questionId] = {
                      multipleChoice: text.id ? text.id : text,
                    }
                    break
                  default:
                    break
                }
              }
              if (Object.keys(body).length !== 0) {
                doApiRequest('/users/question_response/?format=json', {
                  method: 'POST',
                  body,
                })
                  .then((resp) => {
                    if (resp.status === 200) {
                      return resp.json()
                    } else if (resp.status === 400) {
                      setSaved(false)
                      setErrors('User profile is incomplete. Redirecting...')
                      setRedirected(true)
                      setTimeout(() => {
                        router.push({
                          pathname: '/settings',
                          query: { from_application: club.code },
                          hash: 'Profile',
                        })
                      }, 1000)
                    } else {
                      setSaved(false)
                      setErrors(
                        `Unknown error. Refresh and/or login. ${resp.status}`,
                      )
                    }
                  })
                  .then((data) => {
                    if (data != null) {
                      if (data.success === false) {
                        setSaved(false)
                        setErrors(data.detail)
                      } else {
                        setSaved(true)
                      }
                    }
                  })
              }
            } else {
              setErrors(submitErrors)
            }
          }}
        >
          {(props) => (
            <Form
              onSubmit={props.handleSubmit}
              onChange={() => setSaved(false)}
            >
              {committees !== undefined &&
                committees !== null &&
                committees.length !== 0 && (
                  <>
                    <Field
                      label={
                        'This club has multiple committees open for applications. You can apply to multiple committees by saving one submission and then selecting a different committee in the drop-down menu.'
                      }
                      as={SelectField}
                      choices={committees.map((value) => {
                        return { label: value.name, value: value.name }
                      })}
                      isMulti={false}
                      customHandleChange={(value) => selectCommittee(value)}
                      value={currentCommittee}
                    />
                  </>
                )}
              {visibleQuestions.map((question: ApplicationQuestion) => {
                const input = formatQuestionType(
                  props,
                  question,
                  wordCounts,
                  setWordCounts,
                  false,
                )
                return (
                  <div key={question.id}>
                    {input}
                    <br></br>
                  </div>
                )
              })}
              <button
                type="submit"
                className="button is-primary"
                disabled={loadingResponses}
              >
                <Icon name="edit" alt="save" /> Submit
              </button>
              {errors !== null && (
                <SubmitNotificationSpan className="has-text-danger">
                  {errors}
                </SubmitNotificationSpan>
              )}
              {saved && (
                <>
                  <SubmitNotificationSpan style={{ color: 'green' }}>
                    <Icon name="check-circle" alt="success" /> Saved! (Click{' '}
                    <a href="/settings#submissions">here</a> to see your
                    submissions)
                  </SubmitNotificationSpan>
                </>
              )}
              <br></br>
              <br></br>
              <small>
                Feel free to submit multiple times, only your most recent
                submissions will be shared with the club application reviewers.
              </small>
            </Form>
          )}
        </Formik>
      </Container>
    </>
  )
}

ApplicationPage.getInitialProps = async (
  ctx: NextPageContext,
): Promise<ApplicationPageProps> => {
  const { query, req } = ctx
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const [club, application, questions] = await Promise.all(
    [
      `/clubs/${query.club}/?format=json`,
      `/clubs/${query.club}/applications/${query.application}/?format=json`,
      `/clubs/${query.club}/applications/${query.application}/questions/?format=json`,
    ].map(async (url) => (await doApiRequest(url, data)).json()),
  )

  // a ?committee= in the link says which submission is being edited, so the
  // very first render can already be prefilled from the right one
  const requested = Array.isArray(query.committee)
    ? query.committee[0]
    : query.committee
  const committee =
    requested != null &&
    application?.committees?.some((entry) => entry.name === requested)
      ? requested
      : null

  const initialValues = await fetchResponses(questions, committee, data)

  return { club, application, questions, initialValues }
}

export default renderPage(ApplicationPage)
