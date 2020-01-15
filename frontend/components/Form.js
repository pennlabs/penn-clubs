import s from 'styled-components'
import { Component } from 'react'
import Select from 'react-select'
import { EditorState, ContentState, convertToRaw } from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import Head from 'next/head'

import { Icon } from './common'
import { doApiRequest, titleize } from '../utils'

let htmlToDraft, Editor

/*
 * Represents a form with fields and a submit button.
 * Does not actually perform an ajax request, returns
 * the data in JSON format in the onSubmit event.
 */
class Form extends Component {
  constructor(props) {
    super(props)

    this.state = {
      mounted: false,
      edited: false,
    }

    this.files = {}

    if (process.browser) {
      htmlToDraft = require('html-to-draftjs').default
      Editor = require('react-draft-wysiwyg').Editor

      this.setDefaults(this.props.fields)
    }

    this.onChange = this.onChange.bind(this)
    this.checkChange = this.checkChange.bind(this)
    this.generateField = this.generateField.bind(this)
    this.generateFields = this.generateFields.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  setDefaults(fields) {
    const { defaults } = this.props
    fields.forEach(({ name, type, converter, fields }) => {
      if (type === 'html') {
        if (process.browser) {
          if (defaults && defaults[name]) {
            this.state['editorState-' + name] = EditorState.createWithContent(
              ContentState.createFromBlockArray(
                htmlToDraft(defaults[name]).contentBlocks
              )
            )
          } else {
            this.state['editorState-' + name] = EditorState.createEmpty()
          }
        }
      }
      if (type !== 'group') {
        if (type === 'multiselect') {
          this.state[`field-${name}`] = defaults
            ? (defaults[name] || []).map(converter)
            : []
        } else if (type === 'select') {
          this.state[`field-${name}`] = defaults
            ? converter(defaults[name])
            : null
        } else {
          this.state[`field-${name}`] = defaults ? defaults[name] || '' : ''
        }
      } else {
        this.setDefaults(fields)
      }
    })
  }

  componentDidMount() {
    this.setState({
      mounted: true,
    })
  }

  getAllFields(fields) {
    return (typeof fields === 'undefined' ? this.props.fields : fields).reduce(
      (out, item) => {
        if (item.type === 'group') {
          out = out.concat(this.getAllFields(item.fields))
        } else {
          out.push(item)
        }
        return out
      },
      []
    )
  }

  getData() {
    return this.getAllFields().reduce((out, { type, name, reverser, converter }) => {
      const val = this.state[`field-${name}`]
      switch (type) {
        case 'multiselect': {
          out[name] = (val || []).map(reverser)
          break
        }
        case 'select': {
          out[name] = val ? reverser(val) : val
          break
        }
        case 'checkbox': {
          out[name] = Boolean(val)
          break
        }
        case 'date': {
          out[name] = val || null
          break
        }
        case 'datetime-local': {
          out[name] = val || null
          break
        }
        case 'file': {
          const data = new FormData()
          data.append('file', this.files[name].files[0])
          out[name] = data
          break
        }
        default: {
          if (typeof converter === 'function') {
            out[name] = converter(val)
          } else {
            out[name] = val
          }
        }
        return out
      },
      {}
    )
  }

  generateField(field) {
    const {
      name,
      fields,
      type,
      readonly,
      placeholder = '',
      content,
      accept,
      choices,
      converter,
      label,
      hasLabel = true,
      required,
      help,
    } = field

    let inpt = null

    if (['text', 'url', 'email', 'date', 'datetime-local', 'number'].includes(type)) {
      inpt = (
        <input
          className="input"
          disabled={readonly}
          value={this.state['field-' + name]}
          onChange={e => {
            this.onChange(e)
            this.setState({ ['field-' + name]: e.target.value })
          }}
          key={name}
          type={type}
          name={name}
        />
      )
    } else if (type === 'html') {
      inpt = (
        <div>
          <Head>
            <link
              href="/static/css/react-draft-wysiwyg.css"
              rel="stylesheet"
              key="editor-css"
            />
          </Head>
          {this.state.mounted ? (
            <Editor
              editorState={this.state[`editorState-${name}`]}
              placeholder={placeholder}
              onChange={this.onChange}
              onEditorStateChange={state => {
                this.setState({
                  [`editorState-${name}`]: state,
                  [`field-${name}`]: draftToHtml(
                    convertToRaw(state.getCurrentContent())
                  ),
                })
              }}
              toolbar={{
                options: [
                  'inline',
                  'fontSize',
                  'fontFamily',
                  'list',
                  'textAlign',
                  'colorPicker',
                  'link',
                  'image',
                  'remove',
                  'history',
                ],
              }}
              editorStyle={{
                border: '1px solid #dbdbdb',
                padding: '0 1em',
              }}
            />
          ) : <div />}
        </div>
      )
    } else if (type === 'textarea') {
      inpt = (
        <textarea
          className="textarea"
          value={this.state[`field-${name}`]}
          onChange={e => {
            this.onChange(e)
            this.setState({ [`field-${name}`]: e.target.value })
          }}
        />
      )
    } else if (type === 'group') {
      return (
        <div key={name} className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-header-title">{name}</div>
          </div>
          <div className="card-content">{this.generateFields(fields)}</div>
        </div>
      )
    } else if (type === 'component') {
      return <div key={name}>{content}</div>
    } else if (type === 'file') {
      inpt = (
        <div className="file" key={name}>
          <label className="file-label">
            <input
              className="file-input"
              ref={c => {
                this.files[name] = c
              }}
              onChange={this.onChange}
              accept={accept}
              type="file"
              name={name}
            />
            <span className="file-cta">
              <span className="file-icon">
                <Icon name="upload" alt="upload" />
              </span>
              <span className="file-label">Choose a file...</span>
            </span>
          </label>
        </div>
      )
    } else if (type === 'multiselect') {
      if (this.state.mounted) {
        inpt = (
          <Select
            key={name}
            placeholder={placeholder}
            isMulti={true}
            value={this.state[`field-${name}`] || []}
            options={choices.map(converter)}
            onChange={opt => {
              this.onChange(opt)
              this.setState({ [`field-${name}`]: opt })
            }}
            styles={{
              container: style => ({
                ...style,
                width: '100%',
              }),
            }}
          />
        )
      } else {
        inpt = <div>Loading...</div>
      }
    } else if (type === 'select') {
      inpt = (
        <Select
          key={name}
          value={this.state[`field-${name}`]}
          options={choices}
          onChange={opt => {
            this.onChange(opt)
            this.setState({ [`field-${name}`]: opt })
          }}
        />
      )
    } else if (type === 'checkbox') {
      inpt = (
        <label className="checkbox">
          <input
            type="checkbox"
            checked={this.state[`field-${name}`]}
            onChange={e => {
              this.onChange(e)
              this.setState({ [`field-${name}`]: e.target.checked })
            }}
          />
          &nbsp;
          {label}
        </label>
      )
    } else {
      inpt = (
        <span style={{ color: 'red' }}>{`Unknown field type '${type}'!`}</span>
      )
    }

    const isHorizontal =
      typeof this.props.isHorizontal !== 'undefined'
        ? this.props.isHorizontal
        : true

    return (
      <div
        key={name}
        className={'field' + (isHorizontal ? ' is-horizontal' : '')}
      >
        {hasLabel && (
          <div className="field-label is-normal">
            <label className="label">
              {type === 'checkbox' ? titleize(name) : label || titleize(name)}
              {required && <span style={{ color: 'red' }}>*</span>}
            </label>
          </div>
        )
        }
        <div className="field-body">
          <div className="field">
            <div className="control">{inpt}</div>
            {help && <p className="help">{help}</p>}
          </div>
        </div>
      </div>
    )
  }

  generateFields(fields) {
    return fields.map(this.generateField)
  }

  onChange(e) {
    const { onChange } = this.props
    if (onChange) {
      onChange(e)
    }
    this.checkChange()
  }

  checkChange() {
    this.state.edited || this.setState({ edited: true })
  }

  handleSubmit() {
    // Allow onSubmit to be a Promise or async function. If Promise.resolve is passed some
    // other value, it resolves with that value.
    const { onSubmit } = this.props
    onSubmit &&
      Promise.resolve(onSubmit(this.getData())).then(() => {
        this.setState({ edited: false })
      })
  }

  render() {
    const { submitButton, disabledSubmitButton, fields } = this.props
    const { edited } = this.state

    // If both submitButton and disabledSubmitButton are provided or not provided, then
    // we can disable or enable the button. Otherwise, we show the submitButton by default
    // and form validation must be implemented in the parent component.
    let button
    if (edited) {
      if (submitButton) {
        button = <span onClick={this.handleSubmit}>{submitButton}</span>
      } else {
        button = (
          <a
            className="button is-primary is-medium"
            onClick={this.handleSubmit}
          >
            Submit
          </a>
        )
      }
    } else {
      if (disabledSubmitButton) {
        button = <span>{disabledSubmitButton}</span>
      } else if (submitButton) {
        button = <span onClick={this.handleSubmit}>{submitButton}</span>
      } else {
        button = (
          <a
            className="button is-primary is-medium"
            title="You must make changes before submitting."
            disabled
          >
            Submit
          </a>
        )
      }
    }

    return (
      <>
        {this.generateFields(fields)}
        {button}
      </>
    )
  }
}

const ModelItem = s.div`
  padding: 15px;
  border: 1px solid #dbdbdb;
  border-radius: 3px;
  margin-bottom: 1em;
`

/*
 * Creates a form with CRUD (create, read, update, delete)
 * capabilities for a Django model using a provided endpoint.
 */
export class ModelForm extends Component {
  constructor(props) {
    super(props)

    this.state = {
      objects: null,
    }
  }

  componentDidMount() {
    doApiRequest(`${this.props.baseUrl}?format=json`)
      .then(resp => resp.json())
      .then(resp => {
        this.setState({ objects: resp })
      })
  }

  render() {
    const { objects } = this.state
    const { fields, baseUrl } = this.props

    if (!objects) {
      return <></>
    }

    return (
      <>
        {objects.map(object => (
          <ModelItem key={object.id}>
            <Form
              fields={fields}
              defaults={object}
              submitButton={
                <span className="button is-primary">
                  <Icon name="edit" alt="save" /> Save
                </span>
              }
              onSubmit={data => {
                if (typeof object.id === 'undefined') {
                  doApiRequest(`${baseUrl}?format=json`, {
                    method: 'POST',
                    body: data,
                  }).then(resp => {
                    if (resp.ok) {
                      resp.json().then(resp => {
                        Object.keys(resp).forEach(key => {
                          object[key] = resp[key]
                        })
                      })
                    }
                  })
                } else {
                  doApiRequest(`${baseUrl}${object.id}/?format=json`, {
                    method: 'PATCH',
                    body: data,
                  })
                }
              }}
            />
            <span
              className="button is-danger"
              style={{ marginLeft: '0.5em' }}
              onClick={() => {
                if (typeof object.id !== 'undefined') {
                  doApiRequest(`${baseUrl}${object.id}/?format=json`, {
                    method: 'DELETE',
                  }).then(resp => {
                    if (resp.ok) {
                      this.setState(({ objects }) => {
                        objects.splice(objects.indexOf(object), 1)
                        return { objects }
                      })
                    }
                  })
                } else {
                  this.setState(({ objects }) => {
                    objects.splice(objects.indexOf(object), 1)
                    return { objects }
                  })
                }
              }}
            >
              <Icon name="trash" alt="trash" /> Delete
            </span>
          </ModelItem>
        ))}
        <span onClick={() => this.setState(({ objects }) => {
          objects.push({})
          return { objects }
        })} className="button is-primary">
          <Icon name="plus" alt="create" /> Create
        </span>
      </>
    )
  }
}

export default Form
