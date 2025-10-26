import { Field, Form, Formik } from 'formik'
import { ReactElement, useState } from 'react'
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
}

/**
 * A card that allows club officers to view, download, delete, and add files to the club.
 */
export default function FilesCard({ club }: FilesCardProps): ReactElement<any> {
  const [files, setFiles] = useState<File[]>(club.files)

  const reloadFiles = async (): Promise<void> => {
    await doApiRequest(`/clubs/${club.code}/assets/?format=json`)
      .then((resp) => resp.json())
      .then(setFiles)
  }

  const submitForm = (data, { setSubmitting, resetForm, setStatus }) => {
    const formData = new FormData()
    formData.append('file', data.file)
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
                <td>{a.name}</td>
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
