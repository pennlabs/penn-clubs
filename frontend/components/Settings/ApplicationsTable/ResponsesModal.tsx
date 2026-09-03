import { Form, Formik } from 'formik'
import moment from 'moment-timezone'
import { ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { Icon, Loading, Text } from '~/components/common'
import { BORDER, CLUBS_GREY, CLUBS_NAVY, MEDIUM_GRAY } from '~/constants/colors'
import {
  computeWordCount,
  formatQuestionType,
} from '~/pages/club/[club]/application/[application]'
import {
  ApplicationQuestion,
  ApplicationQuestionType,
  ApplicationSubmission,
  UserApplication,
  UserApplicationSubmission,
} from '~/types'
import { doApiRequest } from '~/utils'

import { editHref } from './shared'

const Header = styled.div`
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid ${BORDER};
`

const FailedState = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  & p {
    margin-bottom: 0;
  }
`

const Title = styled.p`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${CLUBS_NAVY};
  line-height: 1.25;
`

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: ${MEDIUM_GRAY};
  margin-top: 0.25rem;
`

const Body = styled.div`
  padding: 1.5rem;
  text-align: left;
  color: ${CLUBS_GREY};
`

const Question = styled.div`
  margin-bottom: 1.25rem;
`

const Unanswered = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.15rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #946c00;
`

const Footer = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid ${BORDER};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const Push = styled.span`
  margin-left: auto;
`

type Props = {
  application: UserApplication
  submission: UserApplicationSubmission
  onDelete: () => void
  onClose: () => void
}

/**
 * The tracker list deliberately does not carry question responses, since they
 * are long and almost never read. They are fetched from /submissions/ the
 * first time someone opens this.
 */
const ResponsesModal = ({
  application,
  submission,
  onDelete,
  onClose,
}: Props): ReactElement<any> => {
  const [detail, setDetail] = useState<ApplicationSubmission | null>(null)
  const [questions, setQuestions] = useState<ApplicationQuestion[] | null>(null)
  const [failed, setFailed] = useState<boolean>(false)
  // bumped by Retry to re-run the effect below without duplicating the fetch
  const [attempt, setAttempt] = useState<number>(0)

  useEffect(() => {
    let cancelled = false
    setFailed(false)
    Promise.all([
      doApiRequest(`/submissions/${submission.pk}/?format=json`),
      doApiRequest(
        `/clubs/${application.club_code}/applications/${application.id}` +
          `/questions/?format=json`,
      ),
    ])
      .then(([one, two]) =>
        one.ok && two.ok
          ? Promise.all([one.json(), two.json()])
          : Promise.reject(new Error('failed')),
      )
      .then(([submissionDetail, applicationQuestions]) => {
        if (cancelled) return
        setDetail(submissionDetail)
        setQuestions(applicationQuestions)
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [submission.pk, application.club_code, application.id, attempt])

  const initialValues = {}
  const wordCounts = {}
  detail?.responses?.forEach((response) => {
    switch (parseInt(response.question_type)) {
      case ApplicationQuestionType.FreeResponse:
        wordCounts[response.question.id] =
          response.text != null ? computeWordCount(response.text) : 0
        initialValues[response.question.id] = response.text
        break
      case ApplicationQuestionType.ShortAnswer:
        initialValues[response.question.id] = response.text
        break
      case ApplicationQuestionType.MultipleChoice:
        initialValues[response.question.id] =
          response.multiple_choice !== null
            ? response.multiple_choice.value
            : null
        break
      default:
        break
    }
  })

  /**
   * A blank answer stores no response row, so listing responses alone hides
   * every question that was left empty. Render the questions that applied to
   * this committee instead, and mark the ones with nothing recorded.
   */
  const answered = new Set(
    (detail?.responses ?? []).map((response) => response.question.id),
  )
  const applicable = (questions ?? []).filter(
    (question) =>
      question.question_type !== ApplicationQuestionType.InfoText &&
      (!question.committee_question ||
        question.committees.some(
          (committee) => committee.name === submission.committee,
        )),
  )

  return (
    <>
      <Header>
        <Title>
          {application.name} &mdash; {submission.committee}
        </Title>
        <Subtitle>
          {application.club_name} &middot; submitted{' '}
          {moment(submission.created_at).tz('America/New_York').format('LLL')}
        </Subtitle>
      </Header>
      <Body>
        {failed ? (
          <FailedState>
            <Text>We couldn&apos;t load your responses.</Text>
            <button
              className="button is-small"
              onClick={() => setAttempt((value) => value + 1)}
            >
              Retry
            </button>
          </FailedState>
        ) : detail == null ? (
          <Loading />
        ) : applicable.length === 0 ? (
          <Text>This application has no questions.</Text>
        ) : (
          <Formik initialValues={initialValues} onSubmit={() => undefined}>
            {() => (
              <Form>
                {applicable.map((question) => (
                  <Question key={question.id}>
                    {formatQuestionType(
                      null,
                      question,
                      wordCounts,
                      () => undefined,
                      true,
                    )}
                    {!answered.has(question.id) && (
                      <Unanswered>
                        <Icon name="alert-circle" alt="" size="0.85rem" />
                        Not answered
                      </Unanswered>
                    )}
                  </Question>
                ))}
              </Form>
            )}
          </Formik>
        )}
      </Body>
      <Footer>
        <button className="button is-danger is-light" onClick={onDelete}>
          <Icon name="trash" alt="delete" /> Delete submission
        </button>
        <Push />
        <button className="button" onClick={onClose}>
          Close
        </button>
        {application.is_open && (
          <a
            href={editHref(application, submission)}
            className="button is-primary"
          >
            <Icon name="edit" alt="edit" /> Edit &amp; resubmit
          </a>
        )}
      </Footer>
    </>
  )
}

export default ResponsesModal
