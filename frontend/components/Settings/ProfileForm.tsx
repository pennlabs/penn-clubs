import { Field, Form, Formik } from 'formik'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactElement, useEffect, useState } from 'react'

import { CLUB_APPLY_ROUTE, PROFILE_ROUTE } from '../../constants'
import { UserInfo } from '../../types'
import { doApiRequest, formatResponse } from '../../utils'
import { OBJECT_NAME_PLURAL, OBJECT_NAME_SINGULAR } from '../../utils/branding'
import { Icon } from '../common'
import {
  CheckboxField,
  FileField,
  FormStyle,
  SelectField,
  TextField,
} from '../FormComponents'

type Props = {
  settings: UserInfo
  onUpdate: (info: UserInfo) => void
}

const ProfileForm = ({
  settings,
  onUpdate = () => undefined,
}: Props): ReactElement<any> => {
  const router = useRouter()
  const [schools, setSchools] = useState([])
  const [majors, setMajors] = useState([])
  const [errorMessage, setErrorMessage] = useState<
    ReactElement<any> | string | null
  >(null)
  const [showNotification, setShowNotification] = useState<boolean>(false)
  const [fromApplication, setFromApplication] = useState<string | null>(null)

  useEffect(() => {
    doApiRequest('/schools/?format=json')
      .then((resp) => resp.json())
      .then(setSchools)

    doApiRequest('/majors/?format=json')
      .then((resp) => resp.json())
      .then(setMajors)

    // Check if redirected from application page with incomplete profile
    if (router.query.from_application) {
      setShowNotification(true)
      setFromApplication(router.query.from_application as string)
    }
  }, [router.query])

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

  const affiliations = [
    { value: 0, label: 'Undergraduate Student' },
    { value: 1, label: 'Masters Student' },
    { value: 2, label: 'Professional Student' },
    { value: 3, label: 'Doctoral Student' },
    { value: 4, label: 'Faculty or Staff Member' },
  ]

  return (
    <>
      {showNotification && (
        <div className="notification is-warning">
          <button
            className="delete"
            onClick={() => setShowNotification(false)}
          ></button>
          <strong>Please complete your profile information:</strong> You need to
          provide your graduation year, school, and major to apply for club
          memberships.
        </div>
      )}
      <Formik
        initialValues={{ ...settings, image: settings.image_url }}
        onSubmit={submit}
        enableReinitialize
      >
        {({ dirty, isSubmitting }) => (
          <Form>
            <FormStyle isHorizontal>
              <Field
                name="image"
                as={FileField}
                label="Profile Picture"
                isImage
              />
              <Field name="graduation_year" as={TextField} type="number" />
              <Field
                name="affiliation"
                as={SelectField}
                choices={affiliations}
                valueDeserialize={(val) =>
                  affiliations.find((item) => item.value === val)
                }
              />
              <Field name="school" as={SelectField} choices={schools} isMulti />
              <Field name="major" as={SelectField} choices={majors} isMulti />
              <Field
                name="share_bookmarks"
                as={CheckboxField}
                label={`Share my user information with the ${OBJECT_NAME_PLURAL} that I have bookmarked. By default, this information is not visible to ${OBJECT_NAME_SINGULAR} administrators.`}
              />
              <Field
                name="show_profile"
                as={CheckboxField}
                label={
                  <>
                    Allow my profile page to be visible to the public. You can
                    view your profile page{' '}
                    <Link
                      legacyBehavior
                      href={PROFILE_ROUTE()}
                      as={PROFILE_ROUTE(settings.username)}
                    >
                      <a>here</a>
                    </Link>
                    .
                  </>
                }
              />
              <div className="buttons is-flex is-horizontal">
                <button
                  type="submit"
                  disabled={!dirty || isSubmitting}
                  className="button is-success mr-2"
                >
                  <Icon alt="save" name={dirty ? 'edit' : 'check-circle'} />
                  {dirty ? 'Save' : 'Saved!'}
                </button>
                {fromApplication && (
                  <Link
                    href={CLUB_APPLY_ROUTE(fromApplication)}
                    className="button is-link"
                  >
                    Return to Application <Icon name="chevrons-right" />
                  </Link>
                )}
              </div>
            </FormStyle>
          </Form>
        )}
      </Formik>
      {errorMessage}
    </>
  )
}

export default ProfileForm
