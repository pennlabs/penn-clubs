import { ContentState, convertToRaw, EditorState } from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import Head from 'next/head'
import Router from 'next/router'
import { Component } from 'react'
import DatePicker from 'react-datepicker'
import Select from 'react-select'
import s from 'styled-components'

import { titleize } from '../utils'
import AddressField from './ClubEditPage/AddressField'
import { Icon } from './common'
import EmbedOption, {
  blockRendererFunction,
  entityToHtml,
  htmlToEntity,
} from './EmbedOption'

const UNSAVED_MESSAGE =
  'You have unsaved changes. Are you sure you want to leave?'

let htmlToDraft, Editor

const DatePickerWrapper = s.span`
  & .react-datepicker-wrapper {
    width: 100%;
  }
`

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
      uploadPreview: {},
    }

    this.files = {}

    if (process.browser) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      htmlToDraft = require('html-to-draftjs').default
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      Editor = require('react-draft-wysiwyg').Editor
      const { fields, defaults = {} } = props

      const setDefaults = (fields) => {
        fields.forEach(({ name, type, converter, fields }) => {
          const value = defaults[name]
          if (type === 'group') {
            setDefaults(fields)
          } else if (type === 'html') {
            this.state[`editorState-${name}`] = value
              ? EditorState.createWithContent(
                  ContentState.createFromBlockArray(
                    htmlToDraft(value, htmlToEntity).contentBlocks,
                  ),
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
    this.removeUpload = this.removeUpload.bind(this)
    this.handleUploadClick = this.handleUploadClick.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleUpload(e, name, preview) {
    if (e.target.files[0]) {
      const newDict = Object.assign({}, this.state.uploadStatus)
      newDict[name] = e.target.files[0].name
      this.setState({
        uploadStatus: newDict,
        edited: true,
      })
      this.onChange(e)

      if (preview) {
        const reader = new FileReader()

        reader.onload = (e) => {
          this.setState((state) => ({
            uploadPreview: { ...state.uploadPreview, [name]: e.target.result },
          }))
        }

        reader.readAsDataURL(e.target.files[0])
      }
    }
  }

  removeUpload(name) {
    this.setState((state) => ({
      uploadStatus: { ...state.uploadStatus, [name]: false },
      uploadPreview: { ...state.uploadPreview, [name]: false },
      edited: true,
    }))
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
    fields.forEach((item) => {
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
      case 'file':
      case 'image': {
        if (this.state.uploadStatus[name] === false) {
          return null
        }
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
      disabled = false,
      required,
      help,
      trivia,
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
          onChange={(e) => {
            this.setState({ ['field-' + name]: e.target.value }, () =>
              this.onChange(e),
            )
          }}
          key={name}
          type={type}
          name={name}
          disabled={disabled}
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
            onChange={(val) => {
              this.setState({ ['field-' + name]: val }, () =>
                this.onChange(val),
              )
            }}
            disabled={disabled}
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
              onEditorStateChange={(state) => {
                this.setState({
                  [`editorState-${name}`]: state,
                  [`field-${name}`]: draftToHtml(
                    convertToRaw(state.getCurrentContent()),
                    undefined,
                    undefined,
                    entityToHtml,
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
              toolbarCustomButtons={[<EmbedOption />]}
              customBlockRenderFunc={blockRendererFunction}
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
          onChange={(e) => {
            this.setState({ [`field-${name}`]: e.target.value }, () =>
              this.onChange(e),
            )
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
    } else if (type === 'file' || type === 'image') {
      let preview = false
      let deleted = false
      if (this.state.uploadPreview[name] !== undefined) {
        preview = this.state.uploadPreview[name]
        if (preview === false) {
          deleted = true
        }
      } else {
        preview = field.value
      }

      inpt = (
        <>
          {type === 'image' && preview && (
            <div className="mb-3">
              <img style={{ height: 100 }} src={preview} alt="current value" />
            </div>
          )}
          {deleted && <small>(submit form to confirm deletion)</small>}
          <div className="file" key={name}>
            <label className="file-label">
              <input
                className="file-input"
                ref={(c) => {
                  this.files[name] = c
                }}
                accept={accept}
                type="file"
                name={name}
                onChange={(e) => this.handleUpload(e, name, type === 'image')}
                onClick={(e) => this.handleUploadClick(e, name)}
              />
              <span className="file-cta">
                <span className="file-icon">
                  <Icon name="upload" alt="upload" />
                </span>
                <span className="file-label">Choose a file...</span>
              </span>
              {trivia}
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
            ) : (
              type === 'image' &&
              field.value &&
              this.state.uploadStatus[name] !== false && (
                <button
                  className="ml-3 button is-danger"
                  onClick={() => this.removeUpload(name)}
                >
                  <Icon name="trash" /> Remove Image
                </button>
              )
            )}
          </div>
        </>
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
            onChange={(opt) => {
              this.setState({ [`field-${name}`]: opt }, () =>
                this.onChange(opt),
              )
            }}
            styles={{
              container: (style) => ({
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
          onChange={(opt) => {
            this.setState({ [`field-${name}`]: opt }, () => this.onChange(opt))
          }}
        />
      )
    } else if (type === 'checkbox') {
      inpt = (
        <label className="checkbox">
          <input
            type="checkbox"
            disabled={disabled}
            checked={value}
            onChange={(e) => {
              this.setState({ [`field-${name}`]: e.target.checked }, () =>
                this.onChange(e),
              )
            }}
          />
          &nbsp;
          {label}
        </label>
      )
    } else if (type === 'location') {
      inpt = (
        <AddressField
          addressValue={value}
          changeAddress={(address) => {
            this.setState({ [`field-${name}`]: address }, () =>
              this.onChange(address),
            )
          }}
        ></AddressField>
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
        {hasLabel && !(type === 'checkbox' && !isHorizontal) && (
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
    const {
      submitButton,
      disabledSubmitButton,
      fields,
      enableSubmitWithoutEdit = false,
      submitButtonAttributes = 'button is-primary is-medium',
    } = this.props
    const { edited } = this.state

    // If both submitButton and disabledSubmitButton are provided or not provided, then
    // we can disable or enable the button. Otherwise, we show the submitButton by default
    // and form validation must be implemented in the parent component.
    let button
    if (edited || enableSubmitWithoutEdit) {
      if (submitButton) {
        button = <span onClick={this.handleSubmit}>{submitButton}</span>
      } else {
        button = (
          <a className={submitButtonAttributes} onClick={this.handleSubmit}>
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
            className={submitButtonAttributes}
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

export default Form
