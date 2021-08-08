import ClubMetadata from 'components/ClubMetadata'
import { Container, Icon, Title } from 'components/common'
import { Field, Form, Formik } from 'formik'
import { NextPageContext } from 'next'
import React, { ReactElement, useState } from 'react'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { ApplicationQuestion, ApplicationQuestionType, Club } from 'types'
import { doApiRequest } from 'utils'

import { SelectField, TextField } from '~/components/FormComponents'

type Application = {
  name: string
  application_start_time: string
  application_end_time: string
  result_release_time: string
  external_url: string | null
  committees: Array<{ name: string }> | null
}

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
      return (
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
          readOnly={readOnly}
        />
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
    if (question.question_type !== ApplicationQuestionType.CommitteeQuestion) {
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
          <Title className="is-pulled-left">{application.name}</Title>
        </div>
        <hr />
        <Formik
          initialValues={initialValues}
          onSubmit={(values: { [id: number]: any }, actions) => {
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
                setErrors('One of your responses exceeds the word limit!')
              }
            }

            if (errors === null) {
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

                switch (question?.question_type) {
                  case ApplicationQuestionType.FreeResponse:
                  case ApplicationQuestionType.ShortAnswer:
                  case ApplicationQuestionType.CommitteeQuestion:
                    body[questionId] = {
                      text,
                    }
                    break
                  case ApplicationQuestionType.MultipleChoice:
                    body[questionId] = {
                      multipleChoice: text,
                    }
                    break
                  default:
                    break
                }
              }
              if (Object.keys(body).length !== 0) {
                console.log(body)
                doApiRequest('/users/questions/?format=json', {
                  method: 'POST',
                  body,
                })
              }
              setSaved(true)
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
                        'This club has multiple committees open for applications. Please select the one that interests you (you can submit again if you intend on applying to multiple).'
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
                <SubmitNotificationSpan style={{ color: 'green' }}>
                  <Icon name="check-circle" alt="success" /> Saved!
                </SubmitNotificationSpan>
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
        `/users/questions?format=json&prompt=${question.prompt}`,
      ]
    })
    .reduce(async (accPromise, params: [number, string]) => {
      const [id, url] = params
      const acc = await accPromise
      const payload = await (await doApiRequest(url, data)).json()
      switch (parseInt(payload.question_type)) {
        case ApplicationQuestionType.FreeResponse:
        case ApplicationQuestionType.ShortAnswer:
        case ApplicationQuestionType.CommitteeQuestion:
          acc[id] = payload.text
          break
        case ApplicationQuestionType.MultipleChoice:
          acc[id] = payload.multiple_choice.value
          break
        default:
          return acc
      }
      return acc
    }, {})

  return { club, application, questions, initialValues }
}

export default renderPage(ApplicationPage)
