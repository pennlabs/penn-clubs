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
  onUpdate?: () => void
}

/**
 * A card that allows club officers to view, download, delete, and add files to the club.
 */
export default function FilesCard({
  club,
  onUpdate,
}: FilesCardProps): ReactElement<any> {
  const [files, setFiles] = useState<File[]>(club.files)
  const [constitutionUrl, setConstitutionUrl] = useState<string | null>(
    club.constitution_url,
  )

  useEffect(() => {
    setFiles(club.files)
    setConstitutionUrl(club.constitution_url)
  }, [club.files, club.constitution_url])

  const reloadFiles = async (): Promise<void> => {
    await doApiRequest(`/clubs/${club.code}/assets/?format=json`)
      .then((resp) => resp.json())
      .then(setFiles)
  }

  const submitForm = (data, { setSubmitting, resetForm, setStatus }) => {
    if (!data.file) {
      setStatus({ file: 'Please select a file to upload.' })
      setSubmitting(false)
      return
    }

    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('is_constitution', data.is_constitution ? 'true' : 'false')
    doApiRequest(`/clubs/${club.code}/upload_file/?format=json`, {
      method: 'POST',
      body: formData,
    })
      .then(async (resp) => {
        if (resp.ok) {
          const payload = await resp.json()
          reloadFiles()
          if (data.is_constitution) {
            setConstitutionUrl(`/api/clubs/${club.code}/assets/${payload.id}/`)
            onUpdate?.()
          }
          resetForm()
        } else {
          const err = await resp.json()
          setStatus({
            file:
              err.constitution?.[0] ||
              err.file?.[0] ||
              err.detail ||
              'An error occured while uploading your file.',
          })
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
      <div className="notification is-light py-3 mb-4">
        <strong>Constitution status:</strong>{' '}
        {constitutionUrl ? (
          <>
            <span className="tag is-success is-light">Uploaded</span>{' '}
            <a href={constitutionUrl} target="_blank">
              View current constitution
            </a>
          </>
        ) : (
          <span className="tag is-warning is-light">Not uploaded</span>
        )}
      </div>
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
                  {a.name}{' '}
                  {a.is_constitution && (
                    <span className="tag is-info is-light ml-2">
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
                          if (a.is_constitution) {
                            setConstitutionUrl(null)
                            onUpdate?.()
                          }
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
      <Formik
        initialValues={{ file: null, is_constitution: false }}
        onSubmit={submitForm}
      >
        {({ dirty, isSubmitting, status, values }) => (
          <Form>
            <Field name="file" as={FileField} />
            <label className="checkbox is-block mb-3">
              <Field type="checkbox" name="is_constitution" /> This file is the{' '}
              {OBJECT_NAME_SINGULAR} constitution
            </label>
            {status?.file && (
              <p className="help is-danger mb-3">{status.file}</p>
            )}
            <button
              type="submit"
              disabled={!dirty || !values.file || isSubmitting}
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
