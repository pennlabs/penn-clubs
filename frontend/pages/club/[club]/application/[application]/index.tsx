import 'moment-timezone'

import ClubMetadata from 'components/ClubMetadata'
import { Container, Icon, Title } from 'components/common'
import { Field, Form, Formik } from 'formik'
import moment from 'moment'
import { NextPageContext } from 'next'
import { ReactElement, useState } from 'react'
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
  club,
  application,
  questions,
  initialValues,
}: ApplicationPageProps): ReactElement => {
  if (new Date() < new Date(application.application_start_time)) {
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
  const [currentCommittee, setCurrentCommittee] = useState<{
    label: string
    value: string
  } | null>(null)
  const initialWordCounts: { id?: number } = {}
  questions.forEach((question) => {
    if (question.question_type === ApplicationQuestionType.FreeResponse) {
      initialWordCounts[question.id] = computeWordCount(
        initialValues[question.id],
      )
    }
  })
  const [wordCounts, setWordCounts] = useState<{ id?: number }>(
    initialWordCounts,
  )

  const committees = application?.committees
  questions = questions.filter((question) => {
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
          initialValues={initialValues}
          onSubmit={(values: { [id: number]: any }, actions) => {
            let submitErrors: string | null = null

            // word count error check
            for (const [questionId, text] of Object.entries(values)) {
              const question = questions.find(
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
                const question = questions.find(
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
                      customHandleChange={(value) => setCurrentCommittee(value)}
                      value={currentCommittee}
                    />
                  </>
                )}
              {questions.map((question: ApplicationQuestion) => {
                const input = formatQuestionType(
                  props,
                  question,
                  wordCounts,
                  setWordCounts,
                  false,
                )
                return (
                  <div>
                    {input}
                    <br></br>
                  </div>
                )
              })}
              <button type="submit" className="button is-primary">
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
                    <a href="/apply/submissions">here</a> to see your
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

  // TODO: refactor this, functional methods with async-await is horrible
  const initialValues = await await questions
    .map((question) => {
      return [
        question.id,
        `/users/questions?format=json&question_id=${question.id}`,
      ]
    })
    .reduce(async (accPromise, params: [number, string]) => {
      const [id, url] = params
      const acc = await accPromise
      const payload = await (await doApiRequest(url, data)).json()
      switch (parseInt(payload.question_type)) {
        case ApplicationQuestionType.FreeResponse:
        case ApplicationQuestionType.ShortAnswer:
          acc[id] = payload.text
          break
        case ApplicationQuestionType.MultipleChoice:
          acc[id] =
            payload.multiple_choice !== null
              ? payload.multiple_choice.value
              : null
          break
        default:
          return acc
      }
      return acc
    }, {})

  return { club, application, questions, initialValues }
}

export default renderPage(ApplicationPage)
