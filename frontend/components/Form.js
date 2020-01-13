import { Component } from 'react'
import Select from 'react-select'
import { EditorState, ContentState, convertToRaw } from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import Head from 'next/head'

import { Icon } from './common'
import { titleize } from '../utils'

let htmlToDraft, Editor

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
      }
      return out
    }, {})
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
      required,
      help,
    } = field

    let inpt = null

    if (['text', 'url', 'email', 'date', 'number'].includes(type)) {
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
              onEditorStateChange={state => {
                this.checkChange()
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
              onChange={this.checkChange}
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
        <div className="field-label is-normal">
          <label className="label">
            {type === 'checkbox' ? titleize(name) : label || titleize(name)}
            {required && <span style={{ color: 'red' }}>*</span>}
          </label>
        </div>
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

  render() {
    const { submitButton, onSubmit, fields } = this.props
    const { edited } = this.state
    return (
      <>
        {this.generateFields(fields)}
        {typeof submitButton !== 'undefined' ? (
          <span onClick={() => onSubmit(this.getData())}>{submitButton}</span>
        ) : (
          <a
            className="button is-primary is-medium"
            title={edited ? '' : 'You must make changes before submitting.'}
            disabled={!edited}
            onClick={() => edited && onSubmit && onSubmit(this.getData())}
          >
            Submit
          </a>
        )}
      </>
    )
  }
}

export default Form
