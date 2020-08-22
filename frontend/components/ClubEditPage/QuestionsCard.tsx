import { ReactElement } from 'react'

import { Club } from '../../types'
import { Empty } from '../common'
import { ModelForm } from '../Form'
import BaseCard from './BaseCard'

type QuestionsCardProps = {
  club: Club
}

export default function QuestionsCard({
  club,
}: QuestionsCardProps): ReactElement {
  return (
    <BaseCard title="Student Questions">
      <p className="mb-3">
        You can see a list of questions that prospective club members have asked
        below. Answering any of these questions will make them publically
        available and show your name as the person who answered the question.
      </p>
      <ModelForm
        empty={
          <Empty>
            No students have asked any questions yet. Check back later!
          </Empty>
        }
        baseUrl={`/clubs/${club.code}/questions/`}
        allowCreation={false}
        fields={[
          {
            name: 'question',
            type: 'textarea',
            disabled: true,
          },
          {
            name: 'answer',
            type: 'textarea',
          },
          {
            name: 'approved',
            type: 'checkbox',
            disabled: true,
            label: 'Is this question and response shown to the public?',
          },
        ]}
      />
    </BaseCard>
  )
}
