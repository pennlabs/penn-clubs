import { Field } from 'formik'
import { ReactElement } from 'react'

import { Club, ClubApplicationRequired } from '../../types'
import {
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
} from '../../utils/branding'
import { Icon, Text } from '../common'
import { DateTimeField, TextField } from '../FormComponents'
import ModelForm from '../ModelForm'
import BaseCard from './BaseCard'

type Props = {
  club: Club
}

export default function ApplicationsCard({ club }: Props): ReactElement {
  return (
    <BaseCard title={`${OBJECT_NAME_TITLE_SINGULAR} Applications`}>
      {club.application_required === ClubApplicationRequired.Open && (
        <div className="notification is-warning">
          <Icon name="alert-triangle" /> Your {OBJECT_NAME_SINGULAR} currently
          has it application status set to open membership. Adding{' '}
          {OBJECT_NAME_SINGULAR} applications here will have no effect on what
          the student sees.
        </div>
      )}
      <Text>
        You can use the interface below to add {OBJECT_NAME_SINGULAR}{' '}
        applications.
      </Text>
      <ul className="mb-3">
        {[
          <>
            Display your application links in a centralized repository of{' '}
            {OBJECT_NAME_SINGULAR} applications.
          </>,
          <>
            Subscribed students will automatically receive email reminders about
            application deadlines.
          </>,
          <>
            Automatically update membership and recruiting statuses based on
            when your applications open and close.
          </>,
        ].map((text, i) => (
          <li key={i}>
            <span className=" ml-3 has-text-success">
              <Icon name="check" />
            </span>{' '}
            {text}
          </li>
        ))}
      </ul>
      <ModelForm
        baseUrl={`/clubs/${club.code}/applications/`}
        defaultObject={{ name: `${club.name} Application` }}
        fields={
          <>
            <Field
              name="name"
              as={TextField}
              helpText="A name for this application, used for identifying it if you have multiple applications per semester."
            />
            <Field
              name="application_start_time"
              as={DateTimeField}
              required={true}
              helpText="The date when your application opens."
            />
            <Field
              name="application_end_time"
              as={DateTimeField}
              required={true}
              helpText="The date when your application closes."
            />
            <Field
              name="result_release_time"
              as={DateTimeField}
              required={true}
              helpText={`The latest date that your ${OBJECT_NAME_SINGULAR} will be releasing admission results.`}
            />
            <Field
              name="external_url"
              as={TextField}
              type="url"
              required={true}
              helpText={`The external URL where students can apply for your ${OBJECT_NAME_SINGULAR}.`}
            />
          </>
        }
        tableFields={[{ name: 'name', label: 'Name' }]}
        noun="Application"
      />
    </BaseCard>
  )
}
