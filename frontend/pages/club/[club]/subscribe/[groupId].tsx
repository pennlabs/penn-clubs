import { Field, Form, Formik } from 'formik'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactElement, useEffect, useState } from 'react'
import renderPage from 'renderPage'
import { SubscriptionGroup, SubscriptionQuestionType, UserInfo } from 'types'
import { doApiRequest } from 'utils'

import { Container, Loading, Text, Title } from '~/components/common'
import AuthPrompt from '~/components/common/AuthPrompt'

type SubscribeFormPageProps = {
  userInfo?: UserInfo
  authenticated: boolean | null
}

function SubscribeFormPage({
  userInfo,
  authenticated,
}: SubscribeFormPageProps): ReactElement<any> {
  const router = useRouter()
  const {
    club: clubCode,
    groupId,
    source,
  } = router.query as {
    club: string
    groupId: string
    source?: string
  }

  const [group, setGroup] = useState<SubscriptionGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!groupId) return
    doApiRequest(`/subscription-groups/${groupId}/public/?format=json`)
      .then(async (r) => {
        const text = await r.text()
        let data: any
        try {
          data = JSON.parse(text)
        } catch {
          setError(`Failed to load form (non-JSON response, HTTP ${r.status}).`)
          setLoading(false)
          return
        }
        if (!r.ok) {
          setError(data?.detail ?? `Failed to load form (HTTP ${r.status}).`)
          setLoading(false)
          return
        }
        setGroup(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(`Network error: ${err?.message ?? String(err)}`)
        setLoading(false)
      })
  }, [groupId])

  if (loading || authenticated === null) {
    return (
      <Container>
        <Loading />
      </Container>
    )
  }

  // Submitting requires a signed-in user, so prompt before showing the form
  // rather than letting a fair QR scan dead-end on a failed submit.
  if (!userInfo) {
    return (
      <AuthPrompt title="One last step..." hasLogin={true}>
        Please log in with your PennKey to fill out this subscription form.
      </AuthPrompt>
    )
  }

  if (error || !group) {
    return (
      <Container>
        <Text>{error ?? 'Subscription form not found.'}</Text>
      </Container>
    )
  }

  if (!group.is_active || (group as any).is_archived) {
    return (
      <Container>
        <Title>{group.name}</Title>
        <div className="notification is-warning">
          This form is not currently accepting submissions.
        </div>
        <Link href={`/club/${clubCode}`} className="button">
          Back to Club Page
        </Link>
      </Container>
    )
  }

  if (submitted) {
    return (
      <Container>
        <Title>Subscribed!</Title>
        <div className="notification is-success">
          You have successfully subscribed to <strong>{group.name}</strong>.
        </div>
        <Link href={`/club/${clubCode}`} className="button is-primary">
          Back to Club Page
        </Link>
      </Container>
    )
  }

  const questions = group.questions ?? []

  // Build initial form values
  const initialValues: Record<string, string> = {}
  questions.forEach((q) => {
    initialValues[`q_${q.id}`] = ''
  })

  const handleSubmit = async (
    values: Record<string, string>,
    { setSubmitting, setFieldError }: any,
  ) => {
    const answers = questions
      .filter((q) => q.question_type !== SubscriptionQuestionType.InfoText)
      .map((q) => {
        const val = values[`q_${q.id}`]
        const isMC = q.question_type === SubscriptionQuestionType.MultipleChoice
        return {
          question: q.id,
          text: isMC ? '' : val,
          multiple_choice: isMC ? (val ? parseInt(val, 10) : null) : null,
        }
      })

    const resp = await doApiRequest(
      `/subscription-groups/${groupId}/submit/?format=json`,
      {
        method: 'POST',
        body: {
          subscription_group: parseInt(groupId, 10),
          answers,
          attribution_source: source ?? 'direct',
        },
      },
    )

    if (resp.ok) {
      setSubmitted(true)
    } else {
      const data = await resp.json()
      if (data.missing_questions) {
        data.missing_questions.forEach((qid: number) => {
          setFieldError(`q_${qid}`, 'This question is required.')
        })
      } else {
        setFieldError('_form', data.detail ?? 'Submission failed.')
      }
    }
    setSubmitting(false)
  }

  return (
    <Container>
      <Title>{group.name}</Title>
      {group.description && <Text>{group.description}</Text>}

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ errors, isSubmitting }) => (
          <Form>
            {(errors as any)._form && (
              <div className="notification is-danger">
                {(errors as any)._form}
              </div>
            )}
            {questions.map((q) => {
              const isInfoText =
                q.question_type === SubscriptionQuestionType.InfoText
              const isMC =
                q.question_type === SubscriptionQuestionType.MultipleChoice
              const isLong =
                q.question_type === SubscriptionQuestionType.FreeResponse

              if (isInfoText) {
                return (
                  <div
                    key={q.id}
                    className="notification is-info is-light mb-3"
                  >
                    {q.prompt}
                  </div>
                )
              }

              return (
                <div key={q.id} className="field mb-4">
                  <label className="label">
                    {q.prompt}
                    {q.required && (
                      <span className="has-text-danger ml-1">*</span>
                    )}
                  </label>
                  <div className="control">
                    {isMC ? (
                      <div className="select">
                        <Field as="select" name={`q_${q.id}`}>
                          <option value="">Select an option...</option>
                          {q.multiple_choice.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.value}
                            </option>
                          ))}
                        </Field>
                      </div>
                    ) : isLong ? (
                      <Field
                        as="textarea"
                        name={`q_${q.id}`}
                        className="textarea"
                        rows={4}
                      />
                    ) : (
                      <Field name={`q_${q.id}`} className="input" type="text" />
                    )}
                  </div>
                  {(errors as any)[`q_${q.id}`] && (
                    <p className="help is-danger">
                      {(errors as any)[`q_${q.id}`]}
                    </p>
                  )}
                </div>
              )
            })}

            <div className="field">
              <button
                type="submit"
                className="button is-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Subscribe'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </Container>
  )
}

export default renderPage(SubscribeFormPage)
