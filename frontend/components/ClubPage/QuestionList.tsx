import { ReactElement, useState } from 'react'
import s from 'styled-components'

import { Club } from '../../types'
import { doApiRequest } from '../../utils'
import Form from '../Form'

const Question = s.div`
  margin-bottom: 15px;
`

const UnansweredText = s.span`
  color: #666;
`

const AnswerText = s.div`
  margin: 5px 0;
  padding: 3px 8px;
  border-left: 5px solid #ccc;
`

const QuoteAuthor = s.i`
  color: #666;
  font-size: 0.8em;
`

type QuestionListProps = {
  club: Club
}

const QuestionList = ({
  club: { name, code, questions },
}: QuestionListProps): ReactElement => {
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formErrors, setFormErrors] = useState(null)

  const handleSubmit = (data) => {
    setFormErrors(null)
    doApiRequest(`/clubs/${code}/questions/?format=json`, {
      method: 'POST',
      body: data,
    })
      .then((resp) => resp.json())
      .then((data) => {
        if ('id' in data) {
          setFormSubmitted(true)
        } else {
          setFormErrors(data)
        }
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
                {question.answer}
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
            by club members.
          </p>
          <p className="mb-3">Thank you for contributing to Penn Clubs!</p>
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
        <>
          <b>Have a question about {name}?</b>
          <Form
            submitButtonAttributes="button is-primary is-small"
            errors={formErrors}
            isHorizontal={false}
            fields={[
              { name: 'question', type: 'textarea', hasLabel: false },
              {
                name: 'is_anonymous',
                type: 'checkbox',
                label: 'Post this question anonymously.',
              },
            ]}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </>
  )
}

export default QuestionList
