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
      saved: false,
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
    doApiRequest('/settings/?format=json', {
      method: 'PATCH',
      body: data,
    })
      .then(resp => resp.json())
      .then(resp => {
        this.setState({ saved: true })
      })
  }

  render() {
    const { settings } = this.props
    const { schools, majors, saved } = this.state

    const fields = [
      {
        name: 'graduation_year',
        type: 'number',
        converter: a => typeof a === 'number' ? a : (a && a.length ? a.replace(/\D/g, '') : null),
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
        onChange={() => this.setState({ saved: false })}
        submitButton={
          <a className="button is-success" disabled={saved}><Icon alt="save" name="edit" /> {saved ? 'Saved!' : 'Save'}</a>
        }
      />
    )
  }
}

export default ProfileForm
