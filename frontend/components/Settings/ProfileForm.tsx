import { ReactElement, useEffect, useState } from 'react'

import { doApiRequest } from '../../utils'
import { Icon } from '../common/Icon'
import Form from '../Form'

const ProfileForm = ({
  settings,
  onUpdate = () => undefined,
}): ReactElement => {
  const [schools, setSchools] = useState([])
  const [majors, setMajors] = useState([])

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
      if (data.image !== null) {
        delete data.image
      }
      doApiRequest('/settings/?format=json', {
        method: 'PATCH',
        body: data,
      })
        .then((resp) => resp.json())
        .then(onUpdate)
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
  ]

  return (
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
  )
}

export default ProfileForm
