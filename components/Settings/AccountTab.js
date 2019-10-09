import Form from '../Form.js'

const fields = [
  {
    name: 'General',
    type: 'group',
    fields: [
      {
        name: 'name',
        type: 'text',
        readonly: true
      },
      {
        name: 'username',
        type: 'text',
        readonly: true
      },
      {
        name: 'email',
        label: 'Primary Email',
        type: 'text',
        readonly: true
      }
    ]
  }
]

export default (props) => {
  const { defaults, onSubmit } = props
  return (
    <Form fields={fields} defaults={defaults} onSubmit={onSubmit} />
  )
}
