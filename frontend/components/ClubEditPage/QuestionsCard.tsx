import { Field } from 'formik'
import { ReactElement } from 'react'

import { Club } from '../../types'
import { OBJECT_NAME_SINGULAR } from '../../utils/branding'
import { Empty } from '../common'
import { CheckboxField, RichTextField, TextField } from '../FormComponents'
import { ModelForm } from '../ModelForm'
import BaseCard from './BaseCard'

type QuestionsCardProps = {
  club: Club
}

export default function QuestionsCard({
  club,
}: QuestionsCardProps): ReactElement<any> {
  return (
    <BaseCard title="Student Questions">
      <p className="mb-3">
        You can see a list of questions that prospective {OBJECT_NAME_SINGULAR}{' '}
        members have asked below. Answering any of these questions will make
        them publicly available and show your name as the person who answered
        the question.
      </p>
      <ModelForm
        empty={
          <Empty>
            No students have asked any questions yet. Check back later!
          </Empty>
        }
        baseUrl={`/clubs/${club.code}/questions/`}
        allowCreation={false}
        fields={
          <>
            <Field name="question" as={TextField} type="textarea" disabled />
            <Field name="answer" as={RichTextField} />
            <Field
              name="approved"
              label="Is this question and response visible to the public?"
              as={CheckboxField}
            />
          </>
        }
      />
    </BaseCard>
  )
}
