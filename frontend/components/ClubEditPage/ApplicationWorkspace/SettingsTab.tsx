import { Field, Form, Formik } from 'formik'
import { ReactElement } from 'react'
import { toast } from 'react-toastify'

import { Club } from '~/types'
import { doApiRequest } from '~/utils'

import {
  ApplicationUpdateTextField,
  DateTimeField,
  RichTextField,
  TextField,
} from '../../FormComponents'
import ModelForm from '../../ModelForm'
import { Panel, WorkspaceApplication } from './shared'

// DRF answers a rejected save with {field: [messages]} or a list of messages
const errorText = (data: any): string =>
  data == null
    ? 'Could not save. Please try again.'
    : Object.values(data).flat().join(' ')

export default function SettingsTab({
  club,
  application,
  onSaved,
}: {
  club: Club
  application: WorkspaceApplication
  onSaved: () => void
}): ReactElement {
  const url = `/clubs/${club.code}/applications/${application.id}/`

  return (
    <>
      <Panel>
        <Formik
          initialValues={{
            name: application.name,
            description: application.description,
            application_start_time: application.application_start_time,
            application_end_time: application.application_end_time,
            result_release_time: application.result_release_time,
            acceptance_email: application.acceptance_email,
            rejection_email: application.rejection_email,
          }}
          enableReinitialize
          onSubmit={async (values, { setSubmitting }) => {
            const resp = await doApiRequest(`${url}?format=json`, {
              method: 'PATCH',
              body: values,
            })
            setSubmitting(false)
            if (resp.ok) {
              toast.success('Settings saved.')
              onSaved()
            } else {
              toast.error(errorText(await resp.json().catch(() => null)))
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <Field name="name" as={TextField} label="Name" />
              <Field
                name="description"
                as={RichTextField}
                helpText="Shown at the top of the application."
              />
              <div className="columns">
                {[
                  ['application_start_time', 'Opens'],
                  ['application_end_time', 'Closes'],
                  ['result_release_time', 'Decisions released by'],
                ].map(([name, label]) => (
                  <div className="column" key={name}>
                    <Field
                      name={name}
                      as={DateTimeField}
                      label={label}
                      required
                    />
                  </div>
                ))}
              </div>
              <Field
                name="acceptance_email"
                as={ApplicationUpdateTextField}
                label="Acceptance email"
                helpText="Use {{ name }}, {{ committee }} and {{ reason }} to fill in details."
              />
              <Field
                name="rejection_email"
                as={ApplicationUpdateTextField}
                label="Rejection email"
              />
              <button
                type="submit"
                className={`button is-primary ${isSubmitting ? 'is-loading' : ''}`}
              >
                Save settings
              </button>
            </Form>
          )}
        </Formik>
      </Panel>

      <Panel>
        <h4 className="title is-5">Extensions</h4>
        <p className="mb-3">
          Give individual applicants more time after the application closes.
        </p>
        <ModelForm
          key={application.id}
          baseUrl={`${url}extensions/`}
          fields={
            <>
              <Field
                name="username"
                as={TextField}
                required
                helpText="The applicant's PennKey."
              />
              <Field name="end_time" as={DateTimeField} required />
            </>
          }
          tableFields={[
            { name: 'first_name', label: 'First name' },
            { name: 'last_name', label: 'Last name' },
            { name: 'username', label: 'PennKey' },
            { name: 'end_time', label: 'Extended until' },
          ]}
          confirmDeletion
          noun="Extension"
        />
      </Panel>
    </>
  )
}
