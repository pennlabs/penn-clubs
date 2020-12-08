import { Field, Form, Formik } from 'formik'
import { ReactElement } from 'react'

import { Club } from '../../types'
import { doApiRequest } from '../../utils'
import { Contact, Icon, Text } from '../common'
import { TextField } from '../FormComponents'
import BaseCard from './BaseCard'

type EventsImportCardProps = {
  club: Club
}

export default function EventsImportCard({
  club,
}: EventsImportCardProps): ReactElement {
  const fetchEvents = (): void => {
    doApiRequest(`/clubs/${club.code}/fetch?format=json`)
  }

  const submit = (data: { url: string }, { setSubmitting }): void => {
    doApiRequest(`/clubs/${club.code}/?format=json`, {
      method: 'PATCH',
      body: { url: data.url },
    })
      .then(() => {
        fetchEvents()
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  return (
    <BaseCard title="Events ICS Import">
      <Text>
        You can enter an ICS URL below to automatically import events from an
        existing calendar. The calendar URL should be a live feed of events. The
        events will be automatically imported once a day. You can also fetch the
        events manually using the button below.
        <span className="content">
          <ul>
            <li>
              If you use Google Calendar, see{' '}
              <a
                rel="noopener noreferrer"
                href="https://support.google.com/calendar/answer/37648?hl=en&ref_topic=3417927"
              >
                this link
              </a>{' '}
              for instructions on how to import your calendar.
            </li>
            <li>
              If you use iCalendar, see{' '}
              <a
                rel="noopener noreferrer"
                href="https://www.techrepublic.com/article/how-to-find-your-icloud-calendar-url/"
              >
                this link
              </a>{' '}
              for instructions on how to import your calendar.
            </li>
            <li>
              If you use an alternative calendar service and cannot find your
              URL, please email <Contact />.
            </li>
          </ul>
        </span>
      </Text>
      <Formik initialValues={{ url: '' }} onSubmit={submit}>
        {({ isSubmitting }) => (
          <Form>
            <Field
              name="url"
              as={TextField}
              type="url"
              label="ICS Calendar URL"
            />
            <div className="buttons">
              <button
                type="submit"
                disabled={isSubmitting}
                className="button is-success"
              >
                <Icon name="save" /> Save URL
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                className="button is-info"
              >
                <Icon name="download" /> Fetch Events
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </BaseCard>
  )
}
