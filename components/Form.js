import React from 'react'
import Select from 'react-select'
import { EditorState, ContentState, convertToRaw } from 'draft-js'
import { Editor } from 'react-draft-wysiwyg'
import { titleize } from '../utils'
import draftToHtml from 'draftjs-to-html'
import htmlToDraft from 'html-to-draftjs'
import Head from 'next/head'

class Form extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      mounted: false
    }

    this.files = {}

    if (process.browser) {
      this.setDefaults(this.props.fields)
    }

    this.generateField = this.generateField.bind(this)
    this.generateFields = this.generateFields.bind(this)
  }

  setDefaults(fields) {
    const { defaults } = this.props
    fields.forEach(({ name, type, converter, fields }) => {
      if (type === 'html') {
        if (defaults && defaults[name]) {
          this.state['editorState-' + name] = EditorState.createWithContent(
            ContentState.createFromBlockArray(
              htmlToDraft(this.props.defaults[name]).contentBlocks
            )
          )
        } else {
          this.state['editorState-' + name] = EditorState.createEmpty()
        }
      }
      if (type !== 'group') {
        if (type === 'multiselect') {
          this.state[`field-${name}`] = defaults ? (defaults[name] || []).map(converter) : []
        } else if (type === 'select') {
          this.state[`field-${name}`] = defaults ? converter(defaults[name]) : null
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
      mounted: true
    })
  }

  getAllFields(fields) {
    return (typeof fields === 'undefined' ? this.props.fields : fields).reduce((out, item) => {
      if (item.type === 'group') {
        out = out.concat(this.getAllFields(item.fields))
      } else {
        out.push(item)
      }
      return out
    }, [])
  }

  getData() {
    return this.getAllFields().reduce((out, { type, name, reverser }) => {
      const val = this.state[`field-${name}`]
      switch (type) {
        case 'multiselect': {
          out[name] = (val || []).map(reverser)
          break
        }
        case 'select': {
          out[name] = reverser(val)
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
          out[name] = val
        }
      }
      return out
    }, {})
  }

  generateField(field) {
    const {
      name, fields, type, readonly, placeholder = '', content, accept, choices,
      converter, label, required, help
    } = field

    let inpt = null

    if (['text', 'url', 'email', 'date'].includes(type)) {
      inpt = (
        <input
          className="input"
          disabled={readonly}
          value={this.state['field-' + name]}
          onChange={(e) => this.setState({ ['field-' + name]: e.target.value })}
          key={name}
          type={type}
          name={name}
        />
      )
    } else if (type === 'html') {
      inpt = (
        <div>
          <Head>
            <link href='/static/css/react-draft-wysiwyg.css' rel='stylesheet' key='editor-css' />
          </Head>
          {this.state.mounted ? (
            <Editor
              editorState={this.state[`editorState-${name}`]}
              placeholder={placeholder}
              onEditorStateChange={(state) => {
                this.setState({
                  [`editorState-${name}`]: state,
                  [`field-${name}`]: draftToHtml(convertToRaw(state.getCurrentContent()))
                })
              }}
              toolbar={{
                options: [
                  'inline', 'fontSize', 'fontFamily', 'list', 'textAlign',
                  'colorPicker', 'link', 'image', 'remove', 'history'
                ]
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
          onChange={(e) => this.setState({ [`field-${name}`]: e.target.value })}
        />
      )
    } else if (type === 'group') {
      return (
        <div key={name} className='card' style={{ marginBottom: 20 }}>
          <div className='card-header'>
            <div className='card-header-title'>{name}</div>
          </div>
          <div className='card-content'>
            {this.generateFields(fields)}
          </div>
        </div>
      )
    } else if (type === 'component') {
      return <div key={name}>{content}</div>
    } else if (type === 'file') {
      inpt = <div className='file' key={name}>
        <label className='file-label'>
          <input
            className="file-input"
            ref={(c) => { this.files[name] = c }}
            accept={accept} type="file"
            name={name} />
          <span className="file-cta">
            <span className="file-icon">
              <i className="fas fa-upload"></i>
            </span>
            <span className="file-label">
              Choose a file...
            </span>
          </span>
        </label>
      </div>
    } else if (type === 'multiselect') {
      if (this.state.mounted) {
        inpt = (
          <Select
            key={name}
            placeholder={placeholder}
            isMulti={true}
            value={(this.state[`field-${name}`] || [])}
            options={choices.map(converter)}
            onChange={(opt) => this.setState({ [`field-${name}`]: opt })}
            styles={{
              container: (style) => ({
                ...style,
                width: '100%'
              })
            }}
          />
        )
      } else {
        inpt = (<div>Loading...</div>)
      }
    } else if (type === 'select') {
      inpt = (
        <Select
          key={name}
          value={this.state[`field-${name}`]}
          options={choices}
          onChange={(opt) => this.setState({ [`field-${name}`]: opt })}
        />
      )
    } else if (type === 'checkbox') {
      inpt = (
        <label className='checkbox'>
          <input
            type="checkbox"
            checked={this.state[`field-${name}`]}
            onChange={(e) => this.setState({ [`field-${name}`]: e.target.checked })}
          />
          {label}
        </label>
      )
    } else {
      inpt = (
        <span style={{ color: 'red' }}>
          {`Unknown field type '${type}'!`}
        </span>
      )
    }

    const isHorizontal = typeof this.props.isHorizontal !== 'undefined' ? this.props.isHorizontal : true

    return (
      <div key={name} className={'field' + (isHorizontal ? ' is-horizontal' : '')}>
        <div className='field-label is-normal'>
          <label className='label'>
            {type === 'checkbox' ? titleize(name) : label || titleize(name)}
            {required && (<span style={{ color: 'red' }}>*</span>)}
          </label>
        </div>
        <div className='field-body'>
          <div className='field'>
            <div className='control'>
              {inpt}
            </div>
            {help && <p className='help'>{help}</p>}
          </div>
        </div>
      </div>
    )
  }

  generateFields(fields) {
    return fields.map(this.generateField)
  }

  render() {
    const { submitButton, onSubmit, fields } = this.props
    return (
      <span>
        {this.generateFields(fields)}
        {(typeof submitButton !== 'undefined') ? (
          <span onClick={() => onSubmit(this.getData())}>
            {submitButton}
          </span>
        ) : (
          <a
            className='button is-primary is-medium'
            onClick={() => onSubmit && onSubmit(this.getData())}>
            Submit
          </a>
        )}
      </span>
    )
  }
}

export default Form
