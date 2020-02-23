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
  }

  componentDidMount() {
    doApiRequest('/schools/?format=json')
      .then(resp => resp.json())
      .then(data =>
        this.setState({
          schools: data,
        })
      )

    doApiRequest('/majors/?format=json')
      .then(resp => resp.json())
      .then(data =>
        this.setState({
          majors: data,
        })
      )
  }

  submit(data) {
    return doApiRequest('/settings/?format=json', {
      method: 'PATCH',
      body: data,
    }).then(resp => resp.json())
  }

  render() {
    const { settings } = this.props
    const { schools, majors } = this.state

    const fields = [
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
            <Icon alt="save" name="edit" />
            Saved!
          </a>
        }
      />
    )
  }
}

export default ProfileForm
