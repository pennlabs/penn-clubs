import { Field, Form, Formik } from 'formik'
import { ReactElement, useEffect, useState } from 'react'

import { UserInfo } from '../../types'
import { doApiRequest, formatResponse } from '../../utils'
import { Icon } from '../common'
import {
  CheckboxField,
  FileField,
  FormStyle,
  MultiselectField,
  TextField,
} from '../FormComponents'

type Props = {
  settings: UserInfo
  onUpdate: (info: UserInfo) => void
}

const ProfileForm = ({
  settings,
  onUpdate = () => undefined,
}: Props): ReactElement => {
  const [schools, setSchools] = useState([])
  const [majors, setMajors] = useState([])
  const [errorMessage, setErrorMessage] = useState<
    ReactElement | string | null
  >(null)

  useEffect(() => {
    doApiRequest('/schools/?format=json')
      .then((resp) => resp.json())
      .then(setSchools)

    doApiRequest('/majors/?format=json')
      .then((resp) => resp.json())
      .then(setMajors)
  }, [])

  function submit(data, { setSubmitting, setStatus }): Promise<void> {
    const infoSubmit = () => {
      setErrorMessage(null)
      if (data.image !== null) {
        delete data.image
      }
      return doApiRequest('/settings/?format=json', {
        method: 'PATCH',
        body: data,
      }).then((resp) => {
        if (resp.ok) {
          resp.json().then(onUpdate)
        } else {
          resp.json().then((resp) => {
            setStatus(resp)
            setErrorMessage(
              <div className="has-text-danger mt-3">
                {formatResponse(resp)}
              </div>,
            )
          })
        }
      })
    }

    if (data.image && data.image instanceof File) {
      const formData = new FormData()
      formData.append('image', data.image)

      return doApiRequest('/settings/?format=json', {
        method: 'PATCH',
        body: formData,
      })
        .then(infoSubmit)
        .finally(() => setSubmitting(false))
    } else {
      return infoSubmit().finally(() => setSubmitting(false))
    }
  }

  return (
    <>
      <Formik
        initialValues={{ ...settings, image: settings.image_url }}
        onSubmit={submit}
        enableReinitialize
      >
        {(props) => (
          <Form>
            <FormStyle isHorizontal>
              <Field
                name="image"
                as={FileField}
                label="Profile Picture"
                isImage
              />
              <Field name="graduation_year" as={TextField} type="number" />
              <Field name="school" as={MultiselectField} choices={schools} />
              <Field name="major" as={MultiselectField} choices={majors} />
              <Field
                name="share_bookmarks"
                as={CheckboxField}
                label="Share my user information with the clubs that I have bookmarked. By default, this information is not visible to club officers."
              />
              <button
                type="submit"
                disabled={!props.dirty}
                className="button is-success"
              >
                <Icon alt="save" name={props.dirty ? 'edit' : 'check-circle'} />
                {props.dirty ? 'Save' : 'Saved!'}
              </button>
            </FormStyle>
          </Form>
        )}
      </Formik>
      {errorMessage}
    </>
  )
}

export default ProfileForm
