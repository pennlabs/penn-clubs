import React from 'react'
import { doApiRequest } from '../../utils'
import Form from '../Form'
import { Icon } from '../common/Icon'

class ProfileForm extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      schools: [],
      majors: [],
    }

    this.submit = this.submit.bind(this)
    this.update = this.update.bind(this)
    this.deleteProfilePic = this.deleteProfilePic.bind(this)
  }

  componentDidMount() {
    doApiRequest('/schools/?format=json')
      .then(resp => resp.json())
      .then(data =>
        this.setState({
          schools: data,
        }),
      )

    doApiRequest('/majors/?format=json')
      .then(resp => resp.json())
      .then(data =>
        this.setState({
          majors: data,
        }),
      )
  }

  update(data) {
    if (this.props.onUpdate) {
      this.props.onUpdate(data)
    }
  }

  submit(data) {
    const infoSubmit = () => {
      delete data.image
      doApiRequest('/settings/?format=json', {
        method: 'PATCH',
        body: data,
      })
        .then(resp => resp.json())
        .then(this.update)
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

  deleteProfilePic() {
    doApiRequest('/settings/?format=json', {
      method: 'PATCH',
      body: { image: null },
    })
      .then(resp => resp.json())
      .then(this.update)
  }

  render() {
    const { settings } = this.props
    const { schools, majors } = this.state

    const fields = [
      {
        name: 'image',
        type: 'file',
      },
      {
        name: 'graduation_year',
        type: 'number',
        converter: a => {
          if (typeof a === 'number') return a
          if (typeof a === 'string' && a.length) return a.replace(/\D/g, '')
          return null
        },
      },
      {
        name: 'school',
        type: 'multiselect',
        choices: schools,
        converter: a => ({ value: a.id, label: a.name }),
        reverser: a => ({ id: a.value, name: a.label }),
      },
      {
        name: 'major',
        type: 'multiselect',
        choices: majors,
        converter: a => ({ value: a.id, label: a.name }),
        reverser: a => ({ id: a.value, name: a.label }),
      },
    ]

    return (
      <>
        <Form
          fields={fields}
          defaults={settings}
          onSubmit={this.submit}
          submitButton={
            <a className="button is-success">
              <Icon alt="save" name="edit" />
              Save
            </a>
          }
          disabledSubmitButton={
            <a className="button is-success" disabled>
              <Icon alt="save" name="check-circle" />
              Saved!
            </a>
          }
        />
        {settings.image_url && (
          <button
            onClick={this.deleteProfilePic}
            className="button is-danger is-pulled-right"
          >
            <Icon name="trash" /> Delete Profile Picture
          </button>
        )}
      </>
    )
  }
}

export default ProfileForm
