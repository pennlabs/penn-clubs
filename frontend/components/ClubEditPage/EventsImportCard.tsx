import { Field, Form, Formik } from 'formik'
import { ReactElement, useState } from 'react'
import { toast } from 'react-toastify'

import { Club } from '../../types'
import { doApiRequest } from '../../utils'
import { Contact, Icon, Text } from '../common'
import { TextField } from '../FormComponents'
import BaseCard from './BaseCard'
import { WHITE } from '~/constants'

type EventsImportCardProps = {
  club: Club
  onFetchEvents?: () => void
}

export default function EventsImportCard({
  club,
  onFetchEvents,
}: EventsImportCardProps): ReactElement {
  const [isFetching, setFetching] = useState<boolean>(false)
  const [isDeleting, setDeleting] = useState<boolean>(false)

  const fetchEvents = (): void => {
    setFetching(true)
    doApiRequest(`/clubs/${club.code}/fetch/?format=json`, { method: 'POST' })
      .then((resp) => resp.json())
      .then((data) => {
        toast[data.success ? 'success' : 'error'](data.message)
        onFetchEvents && onFetchEvents()
      })
      .catch(() => {
        toast.error('Failed to fetch events, an unknown error occured.', {
          style: { color: WHITE },
        })
      })
      .finally(() => setFetching(false))
  }

  const deleteEvents = async (): Promise<void> => {
    setDeleting(true)
    const resp = await doApiRequest(`/clubs/${club.code}/fetch/?format=json`, {
      method: 'DELETE',
    })
    const json = await resp.json()
    toast[json.success ? 'success' : 'error'](json.message)
    setDeleting(false)
  }

  const submit = (data: { url: string }, { setSubmitting }): void => {
    doApiRequest(`/clubs/${club.code}/?format=json`, {
      method: 'PATCH',
      body: { ics_import_url: data.url },
    })
      .then(() => {
        toast.success('Calendar ICS URL has been saved!')
        if (!isFetching) {
          fetchEvents()
        }
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
      </Text>
      <div className="content mb-4">
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
            If you use an alternative calendar service and cannot find your URL,
            please email <Contact />.
          </li>
        </ul>
      </div>
      <Formik initialValues={{ url: club.ics_import_url }} onSubmit={submit}>
        {({ isSubmitting }) => (
          <Form>
            <Field
              name="url"
              as={TextField}
              type="url"
              label="ICS Calendar URL"
              autoComplete="off"
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
                disabled={isSubmitting || isFetching || isDeleting}
                className="button is-info"
                onClick={fetchEvents}
              >
                <Icon name="download" />{' '}
                {isFetching ? 'Fetching Events...' : 'Fetch Events'}
              </button>
              <button
                type="button"
                disabled={isSubmitting || isFetching || isDeleting}
                className="button is-danger"
                onClick={deleteEvents}
              >
                <Icon name="trash" /> Delete Events
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </BaseCard>
  )
}
