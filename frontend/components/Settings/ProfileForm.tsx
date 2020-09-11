import { ReactElement, useEffect, useState } from 'react'

import { UserInfo } from '../../types'
import { doApiRequest, formatResponse } from '../../utils'
import { Icon } from '../common/Icon'
import Form from '../Form'

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

  function submit(data) {
    const infoSubmit = () => {
      setErrorMessage(null)
      if (data.image !== null) {
        delete data.image
      }
      doApiRequest('/settings/?format=json', {
        method: 'PATCH',
        body: data,
      }).then((resp) => {
        if (resp.ok) {
          resp.json().then(onUpdate)
        } else {
          resp.json().then((resp) => setErrorMessage(formatResponse(resp)))
        }
      })
    }

    if (data.image && data.image.get('image') instanceof File) {
      doApiRequest('/settings/?format=json', {
        method: 'PATCH',
        body: data.image,
      }).then(infoSubmit)
    } else {
      infoSubmit()
    }
  }

  const fields = [
    {
      name: 'image',
      type: 'image',
      value: settings.image_url,
      label: 'Profile Picture',
    },
    {
      name: 'graduation_year',
      type: 'number',
      converter: (a) => {
        if (typeof a === 'number') return a
        if (typeof a === 'string' && a.length) return a.replace(/\D/g, '')
        return null
      },
    },
    {
      name: 'school',
      type: 'multiselect',
      choices: schools,
      converter: (a) => ({ value: a.id, label: a.name }),
      reverser: (a) => ({ id: a.value, name: a.label }),
    },
    {
      name: 'major',
      type: 'multiselect',
      choices: majors,
      converter: (a) => ({ value: a.id, label: a.name }),
      reverser: (a) => ({ id: a.value, name: a.label }),
    },
    {
      name: 'share_bookmarks',
      type: 'checkbox',
      label:
        'Share my user information with the clubs that I have bookmarked. By default, this information is not visible to club officers.',
    },
  ]

  return (
    <>
      <Form
        fields={fields}
        defaults={settings}
        onSubmit={submit}
        submitButton={
          <button className="button is-success">
            <Icon alt="save" name="edit" />
            Save
          </button>
        }
        disabledSubmitButton={
          <button className="button is-success" disabled={true}>
            <Icon alt="save" name="check-circle" />
            Saved!
          </button>
        }
      />
      {errorMessage && (
        <div className="has-text-danger mt-3">{errorMessage}</div>
      )}
    </>
  )
}

export default ProfileForm
