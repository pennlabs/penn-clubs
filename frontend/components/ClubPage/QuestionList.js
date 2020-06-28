import s from 'styled-components'
import Form from '../Form'
import { doApiRequest } from '../../utils'

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

const QuestionList = ({ club: { code, questions } }) => {
  const handleSubmit = data => {
    doApiRequest(`/clubs/${code}/questions/?format=json`, {
      method: 'POST',
      body: data,
    })
  }

  return (
    <>
      {questions.map(question => (
        <Question>
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
      <b>Have a question?</b>
      <Form
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
  )
}

export default QuestionList
