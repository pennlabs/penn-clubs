import { Field, Form, Formik } from 'formik'
import { ReactElement, useEffect, useState } from 'react'
import TimeAgo from 'react-timeago'

import { Club, File } from '../../types'
import { doApiRequest } from '../../utils'
import {
  OBJECT_NAME_SINGULAR,
  OBJECT_TAB_FILES_DESCRIPTION,
  SITE_NAME,
} from '../../utils/branding'
import { Icon, Text } from '../common'
import { FileField } from '../FormComponents'
import BaseCard from './BaseCard'

type FilesCardProps = {
  club: Club
  refreshTrigger?: number
}

/**
 * A card that allows club officers to view, download, delete, and add files to the club.
 */
export default function FilesCard({
  club,
  refreshTrigger,
}: FilesCardProps): ReactElement<any> {
  const [files, setFiles] = useState<File[]>(club.files)
  const [clubHasConstitution, setClubHasConstitution] = useState<boolean>(
    club.has_constitution,
  )

  const reloadFiles = async (): Promise<void> => {
    await doApiRequest(`/clubs/${club.code}/assets/?format=json`)
      .then((resp) => resp.json())
      .then(setFiles)

    // use clublist serializer (minimal data)
    await doApiRequest(`/clubs/${club.code}/?format=json`)
      .then((resp) => resp.json())
      .then((data) => {
        setClubHasConstitution(data.has_constitution)
      })
  }

  // trigger reload from ClubEditCard submissions
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      reloadFiles()
    }
  }, [refreshTrigger])

  const submitForm = (data, { setSubmitting, resetForm, setStatus }) => {
    const formData = new FormData()
    formData.append('file', data.file)

    // if filename contains "constitution" then file must be constitution
    const isConstitution = data.file.name.toLowerCase().includes('constitution')
    formData.append('is_constitution', isConstitution.toString())

    doApiRequest(`/clubs/${club.code}/upload_file/?format=json`, {
      method: 'POST',
      body: formData,
    })
      .then((resp) => {
        if (resp.ok) {
          reloadFiles()
          resetForm()
        } else {
          setStatus({ file: 'An error occured while uploading your file.' })
        }
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  return (
    <BaseCard title="Files">
      <Text>
        Files that are uploaded here will only be visible to{' '}
        {OBJECT_NAME_SINGULAR} members and {SITE_NAME} administrators.{' '}
        {OBJECT_TAB_FILES_DESCRIPTION}
      </Text>

      {/* constitution requirement message */}
      {!clubHasConstitution && (
        <div className="notification is-warning is-light mb-4">
          <div className="content">
            <p className="has-text-weight-bold">
              <Icon name="alert-triangle" /> Constitution Upload Required
            </p>
            <p>
              Your {OBJECT_NAME_SINGULAR} is required to upload a constitution.
              You can upload your constitution using the form below or through
              the club edit form.
            </p>
            <p className="has-text-weight-semibold">
              Important: If you choose to upload your constitution from this
              tab, please ensure the file name contains the word "constitution"
              to automatically mark it as a constitution file.
            </p>
          </div>
        </div>
      )}

      <table className="table is-fullwidth">
        <thead>
          <tr>
            <th>Name</th>
            <th>Date Uploaded</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files && files.length ? (
            files.map((a) => (
              <tr key={`${a.id}-${a.name}`}>
                <td>
                  {a.name}
                  {a.is_constitution && (
                    <span className="tag is-info is-small ml-2">
                      Constitution
                    </span>
                  )}
                </td>
                <td>
                  <TimeAgo date={a.created_at} />
                </td>
                <td>
                  <div className="buttons">
                    <button
                      className="button is-small is-danger"
                      onClick={() =>
                        doApiRequest(
                          `/clubs/${club.code}/assets/${a.id}/?format=json`,
                          { method: 'DELETE' },
                        ).then(() => {
                          reloadFiles()
                        })
                      }
                    >
                      <Icon name="x" alt="delete file" /> Delete
                    </button>
                    <a
                      href={`/api/clubs/${club.code}/assets/${a.id}/`}
                      target="_blank"
                      className="button is-small is-primary"
                    >
                      <Icon name="download" alt="download file" /> Download
                    </a>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="has-text-grey">
                There are no uploaded files for this {OBJECT_NAME_SINGULAR}.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Formik initialValues={{}} onSubmit={submitForm}>
        {({ dirty, isSubmitting }) => (
          <Form>
            <Field name="file" as={FileField} />
            <button
              type="submit"
              disabled={!dirty || isSubmitting}
              className="button is-primary"
            >
              <Icon name="upload" alt="upload" />{' '}
              {isSubmitting ? 'Uploading File...' : 'Upload File'}
            </button>
          </Form>
        )}
      </Formik>
    </BaseCard>
  )
}
