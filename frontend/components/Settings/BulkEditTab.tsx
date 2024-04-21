import { Field, Form, Formik } from 'formik'
import React, { ReactElement, useState } from 'react'
import { toast } from 'react-toastify'

import { Badge, ClubFair, Tag } from '../../types'
import { doApiRequest } from '../../utils'
import {
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE,
  OBJECT_NAME_TITLE_SINGULAR,
} from '../../utils/branding'
import { Icon, Text } from '../common'
import { DateTimeField, SelectField, TextField } from '../FormComponents'
import { fixDeserialize } from '../reports/ReportForm'

/**
 * A component where the user can enter a list of club names and get a list of club codes in response.
 */
const ClubNameLookup = (): ReactElement => {
  const [input, setInput] = useState<string>('')
  const [output, setOutput] = useState<string>('')
  const [isLoading, setLoading] = useState<boolean>(false)

  return (
    <>
      <Formik
        initialValues={{ clubs: '' }}
        onSubmit={(data) => {
          setLoading(true)
          setInput(data.clubs)
          doApiRequest(`/clubs/lookup/?format=json`, {
            method: 'POST',
            body: data,
          })
            .then((resp) => resp.json())
            .then((data) => {
              setOutput(data.output)
              setLoading(false)
            })
        }}
      >
        <Form>
          <Field name="clubs" as={TextField} type="textarea" />
          <button
            type="submit"
            className="button is-primary"
            disabled={isLoading}
          >
            <Icon name="search" /> Lookup
          </button>
        </Form>
      </Formik>
      {output.length > 0 && (
        <div className="columns mt-2">
          <pre className="column">{input}</pre>
          <pre className="column">{output}</pre>
        </div>
      )}
    </>
  )
}

export interface BulkEditTabProps {
  tags: Tag[]
  clubfairs: ClubFair[]
  badges: Badge[]
}

const BulkEditTab = ({ tags, clubfairs, badges }: BulkEditTabProps) => {
  const bulkSubmit = async (data, { setSubmitting }) => {
    try {
      const resp = await doApiRequest('/clubs/bulk/?format=json', {
        method: 'POST',
        body: data,
      })
      const contents = await resp.json()
      if (contents.message) {
        toast.info(contents.message, { hideProgressBar: true })
      } else if (contents.error) {
        toast.error(contents.error, { hideProgressBar: true })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="box">
        <div className="is-size-4">{OBJECT_NAME_TITLE_SINGULAR} Editing</div>
        <Text>
          You can use the form below to perform bulk editing on{' '}
          {OBJECT_NAME_PLURAL}. Specify the list of {OBJECT_NAME_SINGULAR} codes
          below, which tags or badges you want to add or remove, and then press
          the action that you desire.
        </Text>
        <Formik initialValues={{ action: 'add' }} onSubmit={bulkSubmit}>
          {({ setFieldValue, handleSubmit, isSubmitting }) => (
            <Form>
              <Field
                as={TextField}
                type="textarea"
                name="clubs"
                label={`List of ${OBJECT_NAME_TITLE}`}
                helpText={`A list of ${OBJECT_NAME_SINGULAR} codes separated by commas, tabs, or new lines. Pasting in an Excel column will usually work perfectly fine.`}
              />
              <Field
                name="tags"
                label="Tags"
                as={SelectField}
                choices={tags}
                valueDeserialize={fixDeserialize(tags)}
                isMulti
                helpText={`Add or remove all of the specified tags.`}
              />
              <Field
                name="badges"
                label="Badges"
                as={SelectField}
                choices={badges}
                deserialize={({ id, label, description, purpose }) => ({
                  value: id,
                  label,
                  description,
                  purpose,
                })}
                formatOptionLabel={({ label, description, purpose }) => (
                  <>
                    {purpose === 'fair' && (
                      <>
                        <Icon name="tent" />{' '}
                      </>
                    )}
                    <b>{label}</b>{' '}
                    <span className="has-text-grey">{description}</span>
                  </>
                )}
                valueDeserialize={fixDeserialize(badges)}
                isMulti
                helpText={`Add or remove all of the specified badges.`}
              />
              <Field
                name="fairs"
                label={`${OBJECT_NAME_TITLE_SINGULAR} Fairs`}
                as={SelectField}
                choices={clubfairs}
                valueDeserialize={fixDeserialize(clubfairs)}
                isMulti
                helpText={`Register or deregister the ${OBJECT_NAME_SINGULAR} for the selected fairs. Does not take into account any fair questions.`}
              />
              <div className="buttons">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="button is-success"
                  onClick={(e) => {
                    e.preventDefault()
                    setFieldValue('action', 'add')
                    handleSubmit()
                  }}
                >
                  <Icon name="plus" /> Bulk Add
                </button>
                <button
                  type="submit"
                  className="button is-danger"
                  disabled={isSubmitting}
                  onClick={(e) => {
                    e.preventDefault()
                    setFieldValue('action', 'remove')
                    handleSubmit()
                  }}
                >
                  <Icon name="x" /> Bulk Remove
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
      <div className="box">
        <div className="is-size-4">Bulk Fair Event Insert</div>
        <Text>
          You can use the form below to perform a bulk insertion of events for a
          particular fair. This will create one event for each{' '}
          {OBJECT_NAME_SINGULAR} registered for the fair between the given
          times. For more fine grained control, you will need to manually create
          the appropriate events.
        </Text>
        <Text>
          This function has a few caveats. It will not create more than one
          event per club. It will not overwrite any existing entries.
        </Text>
        <Formik
          initialValues={{ fair: null }}
          onSubmit={(
            data: { fair: { id: number } | null },
            { setSubmitting },
          ) => {
            if (data.fair != null) {
              doApiRequest(
                `/clubfairs/${data.fair.id}/create_events/?format=json`,
                { method: 'POST', body: data },
              )
                .then((resp) => resp.json())
                .then(({ events }) => {
                  toast.success(`Created or updated ${events} event(s)!`, {
                    hideProgressBar: true,
                  })
                  setSubmitting(false)
                })
            } else {
              setSubmitting(false)
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <Field name="start_time" as={DateTimeField} />
              <Field name="end_time" as={DateTimeField} />
              <Field
                name="suffix"
                as={TextField}
                helpText={`Prevents the creation of duplicate events. Already created events with the same ${OBJECT_NAME_SINGULAR}, fair, and suffix will not be duplicated.`}
              />
              <Field
                name="clubs"
                as={TextField}
                type="textarea"
                helpText={`A list of ${OBJECT_NAME_SINGULAR} codes, separated by commas, tabs, or newlines. If specified, events will only be created for the ${OBJECT_NAME_PLURAL} in the list.`}
              />
              <Field
                name="fair"
                label={`${OBJECT_NAME_TITLE_SINGULAR} Fair`}
                as={SelectField}
                choices={clubfairs}
                helpText={`The ${OBJECT_NAME_SINGULAR} fair to create the events for.`}
              />
              <button
                type="submit"
                className="button is-primary"
                disabled={isSubmitting}
              >
                <Icon name="plus" /> Insert
              </button>
            </Form>
          )}
        </Formik>
      </div>
      <div className="box">
        <div className="is-size-4">Club Name Lookup</div>
        <Text>
          Convert a list of club names into a list of club codes, which can be
          used with the other functions.
        </Text>
        <ClubNameLookup />
      </div>
    </>
  )
}

export default BulkEditTab
