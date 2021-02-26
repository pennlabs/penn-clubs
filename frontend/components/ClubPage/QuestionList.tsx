import { Field, Form, Formik } from 'formik'
import { ReactElement, useState } from 'react'
import Linkify from 'react-linkify'
import styled from 'styled-components'

import { Club, QuestionAnswer } from '../../types'
import { doApiRequest } from '../../utils'
import { OBJECT_NAME_SINGULAR, SITE_NAME } from '../../utils/branding'
import { CheckboxField, TextField } from '../FormComponents'

const Question = styled.div`
  margin-bottom: 15px;
`

const UnansweredText = styled.span`
  color: #666;
`

const AnswerText = styled.div`
  margin: 5px 0;
  padding: 3px 8px;
  border-left: 5px solid #ccc;
`

const QuoteAuthor = styled.i`
  color: #666;
  font-size: 0.8em;
`

type QuestionListProps = {
  club: Club
  questions: QuestionAnswer[]
}

const QuestionList = ({
  club: { name, code },
  questions,
}: QuestionListProps): ReactElement => {
  const [formSubmitted, setFormSubmitted] = useState(false)

  const handleSubmit = (data, { setSubmitting, setStatus }) => {
    doApiRequest(`/clubs/${code}/questions/?format=json`, {
      method: 'POST',
      body: data,
    })
      .then((resp) => resp.json())
      .then((data) => {
        if ('id' in data) {
          setFormSubmitted(true)
        } else {
          setStatus(data)
        }
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  return (
    <>
      {questions.map((question) => (
        <Question key={question.id}>
          {!question.approved && (
            <span className="tag is-light">Unapproved</span>
          )}{' '}
          <b>Question:</b> {question.question}{' '}
          <QuoteAuthor>- {question.author}</QuoteAuthor>
          <AnswerText>
            {question.answer ? (
              <>
                <Linkify>{question.answer}</Linkify>
                <div>
                  <QuoteAuthor>- {question.responder}</QuoteAuthor>
                </div>
              </>
            ) : (
              <UnansweredText>
                This question has not been answered yet.
              </UnansweredText>
            )}
          </AnswerText>
        </Question>
      ))}
      {formSubmitted ? (
        <div className="notification is-primary">
          <b>Your question has been submitted!</b>
          <p>
            It will be posted publically once it has been approved and answered
            by {OBJECT_NAME_SINGULAR} members.
          </p>
          <p className="mb-3">Thank you for contributing to {SITE_NAME}!</p>
          <button
            className="button is-link is-small"
            onClick={(e) => {
              e.preventDefault()
              setFormSubmitted(false)
            }}
          >
            Post another question
          </button>
        </div>
      ) : (
        <Formik initialValues={{ isAnonymous: false }} onSubmit={handleSubmit}>
          <Form>
            <Field
              name="question"
              as={TextField}
              type="textarea"
              label={`Have a question about ${name}?`}
              id="question"
            />
            <Field
              name="is_anonymous"
              as={CheckboxField}
              label="Post this question anonymously."
            />
            <button type="submit" className="button is-primary is-small">
              Submit
            </button>
          </Form>
        </Formik>
      )}
    </>
  )
}

export default QuestionList
