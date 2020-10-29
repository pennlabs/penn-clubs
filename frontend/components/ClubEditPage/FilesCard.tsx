import { Field, Form, Formik } from 'formik'
import { ReactElement, useState } from 'react'
import TimeAgo from 'react-timeago'

import { Club, File } from '../../types'
import { doApiRequest } from '../../utils'
import { Icon } from '../common'
import { FileField } from '../FormComponents'
import BaseCard from './BaseCard'

type FilesCardProps = {
  club: Club
}

export default function FilesCard({ club }: FilesCardProps): ReactElement {
  const [files, setFiles] = useState<File[]>(club.files)

  const reloadFiles = () => {
    doApiRequest(`/clubs/${club.code}/assets/?format=json`)
      .then((resp) => resp.json())
      .then(setFiles)
  }

  const submitForm = (data, { setSubmitting, resetForm }) => {
    const formData = new FormData()
    formData.append('file', data.file)
    doApiRequest(`/clubs/${club.code}/upload_file/?format=json`, {
      method: 'POST',
      body: formData,
    })
      .then((resp) => resp.json())
      .then((resp) => {
        reloadFiles()
      })
      .finally(() => {
        setSubmitting(false)
        resetForm()
      })
  }

  return (
    <BaseCard title="Files">
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
                There are no uploaded files for this club.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Formik initialValues={{}} onSubmit={submitForm}>
        {(props) => (
          <Form>
            <Field name="file" as={FileField} />
            <button
              type="submit"
              disabled={!props.dirty}
              className="button is-success"
            >
              Upload File
            </button>
          </Form>
        )}
      </Formik>
    </BaseCard>
  )
}
