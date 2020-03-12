import s from 'styled-components'
import { Component } from 'react'
import Select from 'react-select'
import Router from 'next/router'
import { EditorState, ContentState, convertToRaw } from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import Head from 'next/head'
import DatePicker from 'react-datepicker'

import { Icon, Loading } from './common'
import {
  getApiUrl,
  formatResponse,
  getRoleDisplay,
  doApiRequest,
  titleize,
} from '../utils'

const UNSAVED_MESSAGE =
  'You have unsaved changes. Are you sure you want to leave?'

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
      uploadStatus: {},
    }

    this.files = {}

    if (process.browser) {
      htmlToDraft = require('html-to-draftjs').default
      Editor = require('react-draft-wysiwyg').Editor
      const { fields, defaults = {} } = props

      const setDefaults = fields => {
        fields.forEach(({ name, type, converter, fields }) => {
          const value = defaults[name]
          if (type === 'group') {
            setDefaults(fields)
          } else if (type === 'html') {
            this.state[`editorState-${name}`] = value
              ? EditorState.createWithContent(
                  ContentState.createFromBlockArray(
                    htmlToDraft(value).contentBlocks
                  )
                )
              : EditorState.createEmpty()
          } else if (type === 'multiselect') {
            this.state[`field-${name}`] = (value || []).map(converter)
          } else if (type === 'select') {
            this.state[`field-${name}`] = value ? converter(value) : null
          } else {
            this.state[`field-${name}`] = value || ''
          }
        })
      }

      setDefaults(fields)
    }

    this.onChange = this.onChange.bind(this)
    this.checkIfEdited = this.checkIfEdited.bind(this)
    this.confirmExit = this.confirmExit.bind(this)
    this.getFieldData = this.getFieldData.bind(this)
    this.confirmRouteChange = this.confirmRouteChange.bind(this)
    this.generateField = this.generateField.bind(this)
    this.generateFields = this.generateFields.bind(this)
    this.handleUpload = this.handleUpload.bind(this)
    this.handleUploadClick = this.handleUploadClick.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleUpload(e, name) {
    if (e.target.files[0]) {
      const newDict = Object.assign({}, this.state.uploadStatus)
      newDict[name] = e.target.files[0].name
      this.setState({
        uploadStatus: newDict,
        edited: true,
      })
    }
  }

  handleUploadClick(e, name) {
    const newDict = Object.assign({}, this.state.uploadStatus)
    delete newDict[name]
    this.setState({
      uploadStatus: newDict,
    })
  }

  confirmRouteChange() {
    const { edited } = this.state
    const { router } = Router
    if (edited && !confirm(UNSAVED_MESSAGE)) {
      router.abortComponentLoad()
      router.events.emit('routeChangeError')
      throw 'Abort link navigation - ignore this error.' // eslint-disable-line
    }
  }

  confirmExit(e) {
    const { edited } = this.state
    if (edited) {
      e.preventDefault()
      e.returnValue = UNSAVED_MESSAGE
      return UNSAVED_MESSAGE
    }
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.confirmExit)
    Router.router.events.on('routeChangeStart', this.confirmRouteChange)
    this.setState({
      mounted: true,
    })
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.confirmExit)
    Router.router.events.off('routeChangeStart', this.confirmRouteChange)
  }

  getAllFields(fields) {
    var out = []
    fields.forEach(item => {
      if (item.type === 'group') {
        out = out.concat(this.getAllFields(item.fields))
      } else {
        out.push(item)
      }
    })
    return out
  }

  getFieldData(name, source, { type, reverser, converter, apiName }) {
    const val = source[`field-${name}`]
    switch (type) {
      case 'multiselect':
        return (val || []).map(reverser)
      case 'select':
        return val ? reverser(val) : val
      case 'checkbox':
        return Boolean(val)
      case 'date':
        return val || null
      case 'file': {
        const data = new FormData()
        data.append(apiName || name, this.files[name].files[0])
        return data
      }
      default:
        return typeof converter === 'function' ? converter(val) : val
    }
  }

  getData(source) {
    const data = {}
    this.getAllFields(this.props.fields).forEach(({ name, ...field }) => {
      data[name] = this.getFieldData(name, source, field)
    })
    return data
  }

  getSubmitData() {
    return this.getData(this.state)
  }

  generateField(field) {
    const {
      name,
      fields,
      type,
      description,
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

    const {
      [`field-${name}`]: value,
      [`editorState-${name}`]: editorState,
    } = this.state

    const { isHorizontal = true, errors } = this.props

    let inpt = null

    if (['text', 'url', 'email', 'date', 'number'].includes(type)) {
      inpt = (
        <input
          className="input"
          disabled={readonly}
          value={value}
          onChange={e => {
            this.onChange(e)
            this.setState({ ['field-' + name]: e.target.value })
          }}
          key={name}
          type={type}
          name={name}
          placeholder={placeholder}
        />
      )
    } else if (type === 'datetime-local') {
      inpt = (
        <DatePickerWrapper>
          <DatePicker
            className="input"
            showTimeSelect
            dateFormat="MMMM d, yyyy h:mm aa"
            selected={Date.parse(value) || value}
            onChange={val => {
              this.onChange(val)
              this.setState({ ['field-' + name]: val })
            }}
            placeholderText={placeholder}
          />
        </DatePickerWrapper>
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
            <link
              href="/static/css/react-datepicker.css"
              rel="stylesheet"
              key="datepicker-css"
            />
          </Head>
          {this.state.mounted ? (
            <Editor
              editorState={editorState}
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
          ) : (
            <div />
          )}
        </div>
      )
    } else if (type === 'textarea') {
      inpt = (
        <textarea
          className="textarea"
          value={value}
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
          <div className="card-content">
            {description}
            {this.generateFields(fields)}
          </div>
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
              accept={accept}
              type="file"
              name={name}
              onChange={e => this.handleUpload(e, name)}
              onClick={e => this.handleUploadClick(e, name)}
            />
            <span className="file-cta">
              <span className="file-icon">
                <Icon name="upload" alt="upload" />
              </span>
              <span className="file-label">Choose a file...</span>
            </span>
          </label>
          {this.state.uploadStatus[name] ? (
            <span style={{ paddingTop: 3, paddingLeft: 8 }}>
              {' '}
              <Icon
                name="check-circle"
                size="1.2rem"
                alt="checkbox"
                style={{ color: 'green' }}
              ></Icon>{' '}
              {this.state.uploadStatus[name]}
            </span>
          ) : null}
        </div>
      )
    } else if (type === 'multiselect') {
      if (this.state.mounted) {
        inpt = (
          <Select
            key={name}
            placeholder={placeholder}
            isMulti={true}
            value={value || []}
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
          value={value}
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
            checked={value}
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

    return (
      <div
        key={name}
        className={isHorizontal ? 'field is-horizontal' : 'field'}
      >
        {hasLabel && (
          <div className="field-label is-normal">
            <label className="label">
              {type === 'checkbox' ? titleize(name) : label || titleize(name)}
              {required && <span style={{ color: 'red' }}>*</span>}
            </label>
          </div>
        )}
        <div className="field-body">
          <div className="field">
            <div className="control">{inpt}</div>
            {(errors && errors[name] && (
              <p className="help is-danger">{errors[name]}</p>
            )) ||
              (help && <p className="help">{help}</p>)}
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
    this.checkIfEdited()
  }

  checkIfEdited() {
    this.state.edited || this.setState({ edited: true })
  }

  handleSubmit() {
    // Clear upload file indicators on submit
    this.setState({
      uploadStatus: {},
    })

    // Allow onSubmit to be a Promise or async function. If Promise.resolve is passed some
    // other value, it resolves with that value.
    const { onSubmit } = this.props
    if (!onSubmit) return
    Promise.resolve(onSubmit(this.getSubmitData())).then(() => {
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

const DatePickerWrapper = s.span`
  & .react-datepicker-wrapper {
    width: 100%;
  }
`

const ModelStatusWrapper = s.span`
  display: inline-block;
  margin: 0.375em 0.75em;
`

const ModelStatus = ({ status }) => (
  <ModelStatusWrapper>
    {typeof status !== 'undefined' &&
      (status === true ? (
        <span style={{ color: 'green' }}>
          <Icon name="check-circle" alt="success" /> Saved!
        </span>
      ) : (
        <span style={{ color: 'red' }}>
          <Icon name="x-circle" alt="failure" /> Failed to save!
        </span>
      ))}
  </ModelStatusWrapper>
)

const Subtitle = s.div`
  font-weight: bold;
  font-size: 1.2em;
  margin-bottom: 0.75em;
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
      currentlyEditing: null,
      createObject: {},
      newCount: 0,
    }

    this.onSubmit = this.onSubmit.bind(this)
    this.onDelete = this.onDelete.bind(this)
    this.onCreate = this.onCreate.bind(this)
  }

  onCreate() {
    this.setState(({ objects, newCount }) => {
      objects.push({
        tempId: newCount,
      })
      return { objects, newCount: newCount + 1 }
    })
  }

  onDelete(object) {
    const { baseUrl, keyField = 'id' } = this.props

    if (typeof object[keyField] !== 'undefined') {
      doApiRequest(`${baseUrl}${object[keyField]}/?format=json`, {
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
  }

  /**
   * Called when the form is submitted to save an individual object.
   * @returns a promise with the first argument as the new object values.
   */
  onSubmit(object, data) {
    const { baseUrl, fields, keyField = 'id' } = this.props

    // remove file fields
    const fileFields = fields.filter(f => f.type === 'file')
    const fileData = {}
    fileFields.forEach(({ name }) => {
      fileData[name] = data[name]
      delete data[name]
    })

    // create or edit the object, uploading all non-file fields
    const savePromise =
      typeof object[keyField] === 'undefined'
        ? doApiRequest(`${baseUrl}?format=json`, {
            method: 'POST',
            body: data,
          })
            .then(resp => {
              if (resp.ok) {
                object._status = true
                return resp.json().then(resp => {
                  Object.keys(resp).forEach(key => {
                    object[key] = resp[key]
                  })
                })
              } else {
                object._status = false
                return resp.json().then(resp => {
                  // eslint-disable-next-line camelcase
                  object._error_message = resp
                })
              }
            })
            .then(() => {
              this.setState(({ objects }) => ({
                objects: [...objects],
              }))
            })
        : doApiRequest(`${baseUrl}${object[keyField]}/?format=json`, {
            method: 'PATCH',
            body: data,
          })
            .then(resp => {
              object._status = resp.ok
              return resp.json()
            })
            .then(resp => {
              if (object._status) {
                Object.keys(resp).forEach(key => {
                  object[key] = resp[key]
                })
              } else {
                // eslint-disable-next-line camelcase
                object._error_message = resp
              }
              this.setState(({ objects }) => ({
                objects: [...objects],
              }))
            })

    // upload all files in the form
    return savePromise
      .then(() => {
        return Promise.all(
          fileFields
            .map(({ name, apiName }) => {
              const fieldData = fileData[name]
              if (fieldData && fieldData.get(apiName || name) instanceof File) {
                return doApiRequest(
                  `${baseUrl}${object[keyField]}/?format=json`,
                  {
                    method: 'PATCH',
                    body: fieldData,
                  }
                )
              }
              return null
            })
            .filter(a => a !== null)
        )
      })
      .then(() => {
        return object
      })
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
    const {
      fields,
      tableFields,
      currentTitle,
      noun = 'Object',
      deleteVerb = 'Delete',
      allowCreation = true,
      confirmDeletion = false,
      keyField = 'id',
    } = this.props

    if (!objects) {
      return <Loading />
    }

    if (tableFields) {
      const { currentlyEditing, createObject } = this.state
      const currentObjectIndex =
        currentlyEditing === null
          ? -1
          : objects.findIndex(a => a[keyField] === currentlyEditing)
      const currentObject =
        currentlyEditing === null ? createObject : objects[currentObjectIndex]

      return (
        <>
          <table className="table is-fullwidth">
            <thead>
              <tr>
                {tableFields.map((a, i) => (
                  <th key={i}>{a.label || titleize(a.name)}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {objects.length === 0 && (
                <tr>
                  <td colSpan={tableFields.length + 1}>
                    There are no {noun.toLowerCase()}s to display.
                  </td>
                </tr>
              )}
              {objects.map((object, i) => (
                <tr key={i}>
                  {tableFields.map((a, i) => (
                    <td key={i}>
                      {a.converter
                        ? a.converter(object[a.name], object)
                        : object[a.name]}
                    </td>
                  ))}
                  <td>
                    <div className="buttons">
                      <button
                        onClick={() =>
                          this.setState({ currentlyEditing: object[keyField] })
                        }
                        className="button is-primary is-small"
                      >
                        <Icon name="edit" alt="edit" /> Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirmDeletion) {
                            if (
                              confirm(
                                `Are you sure you want to ${deleteVerb.toLowerCase()} this ${noun.toLowerCase()}?`
                              )
                            ) {
                              this.onDelete(object)
                            }
                          } else {
                            this.onDelete(object)
                          }
                        }}
                        className="button is-danger is-small"
                      >
                        <Icon name="trash" alt="delete" /> {deleteVerb}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(allowCreation || currentlyEditing !== null) && (
            <>
              <Subtitle>
                {currentlyEditing !== null ? 'Edit' : 'Create'} {noun}{' '}
                {currentTitle && currentlyEditing !== null && (
                  <span style={{ color: '#888', fontSize: '0.8em' }}>
                    {currentTitle(currentObject)}
                  </span>
                )}
              </Subtitle>
              <Form
                key={currentlyEditing}
                fields={fields}
                defaults={currentObject}
                errors={
                  currentObject._status === false &&
                  currentObject._error_message
                }
                onSubmit={data => {
                  if (currentObjectIndex !== -1) {
                    objects[currentObjectIndex] = currentObject
                  }
                  this.onSubmit(currentObject, data).then(obj => {
                    if (obj._status) {
                      if (currentlyEditing === null) {
                        objects.push(obj)
                      }
                      this.setState({
                        objects: [...objects],
                        currentlyEditing: obj[keyField],
                        createObject: {},
                      })
                    } else {
                      this.setState({
                        createObject: obj,
                      })
                    }
                  })
                }}
                submitButton={
                  <>
                    <span className="button is-primary">
                      {currentlyEditing !== null ? (
                        <>
                          <Icon name="edit" alt="save" /> Save
                        </>
                      ) : (
                        <>
                          <Icon name="plus" alt="create" /> Create
                        </>
                      )}
                    </span>
                  </>
                }
              />
            </>
          )}
          {currentlyEditing !== null && (
            <span
              onClick={() =>
                this.setState({
                  currentlyEditing: null,
                  getApiUrl,
                  formatResponse,
                  getRoleDisplay,
                  createObject: {},
                })
              }
              className="button is-primary is-pulled-right"
            >
              {allowCreation ? (
                <>
                  <Icon name="plus" alt="create" /> Create New
                </>
              ) : (
                <>
                  <Icon name="x" alt="close" /> Close
                </>
              )}
            </span>
          )}
          <ModelStatus status={currentObject._status} />
        </>
      )
    }

    return (
      <>
        {objects.map(object => (
          <ModelItem
            key={
              typeof object.id === 'undefined'
                ? `new-${object.tempId}`
                : object.id
            }
          >
            <Form
              fields={fields}
              defaults={object}
              errors={object._status === false && object._error_message}
              submitButton={
                <span className="button is-primary">
                  <Icon name="edit" alt="save" /> Save
                </span>
              }
              onSubmit={data => this.onSubmit(object, data)}
            />
            <span
              className="button is-danger"
              style={{ marginLeft: '0.5em' }}
              onClick={() => this.onDelete(object)}
            >
              <Icon name="trash" alt="trash" /> Delete
            </span>
            <ModelStatus status={object._status} />
          </ModelItem>
        ))}
        <span onClick={this.onCreate} className="button is-primary">
          <Icon name="plus" alt="create" /> Create
        </span>
      </>
    )
  }
}

export default Form
