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

    if (process.browser) {
      this.setDefaults(this.props.fields)
    }
  }

  setDefaults(fields) {
    fields.forEach((item) => {
      if (item.type === 'html') {
        if (this.props.defaults && this.props.defaults[item.name]) {
          this.state['editorState-' + item.name] = EditorState.createWithContent(
            ContentState.createFromBlockArray(
              htmlToDraft(this.props.defaults[item.name]).contentBlocks
            )
          )
        } else {
          this.state['editorState-' + item.name] = EditorState.createEmpty()
        }
      }
      if (item.type !== 'group') {
        if (item.type === 'multiselect') {
          this.state['field-' + item.name] = this.props.defaults ? (this.props.defaults[item.name] || []).map(item.converter) : []
        } else {
          this.state['field-' + item.name] = this.props.defaults ? this.props.defaults[item.name] || '' : ''
        }
      } else {
        this.setDefaults(item.fields)
      }
    })
  }

  componentDidMount() {
    this.setState({
      mounted: true
    })
  }

  getAllFields(fields) {
    var out = [];
    (typeof fields === 'undefined' ? this.props.fields : fields).forEach((item) => {
      if (item.type === 'group') {
        out = out.concat(this.getAllFields(item.fields))
      } else {
        out.push(item)
      }
    })
    return out
  }

  getData() {
    const out = {}
    this.getAllFields().forEach((item) => {
      if (item.type === 'multiselect') {
        out[item.name] = (this.state['field-' + item.name] || []).map(item.reverser)
      } else if (item.type === 'checkbox') {
        out[item.name] = !!this.state['field-' + item.name]
      } else {
        out[item.name] = this.state['field-' + item.name]
      }
    })
    return out
  }

  generateFields(fields) {
    return fields.map((item) => {
      var inpt = null
      if (['text', 'url', 'email'].includes(item.type)) {
        inpt = <input className='input' disabled={item.readonly} value={this.state['field-' + item.name]} onChange={(e) => this.setState({ ['field-' + item.name]: e.target.value })} key={item.name} type={item.type} name={item.name} />
      } else if (item.type === 'html') {
        inpt = <div>
          <Head>
            <link href='/static/css/react-draft-wysiwyg.css' rel='stylesheet' key='editor-css' />
          </Head>
          {this.state.mounted ? <Editor
            editorState={this.state['editorState-' + item.name]}
            placeholder={item.placeholder}
            onEditorStateChange={(state) => {
              this.setState({ ['editorState-' + item.name]: state, ['field-' + item.name]: draftToHtml(convertToRaw(state.getCurrentContent())) })
            }}
            toolbar={{
              options: ['inline', 'fontSize', 'fontFamily', 'list', 'textAlign', 'colorPicker', 'link', 'image', 'remove', 'history']
            }}
          /> : <div>Loading...</div>}
        </div>
      } else if (item.type === 'textarea') {
        inpt = <textarea className='textarea' value={this.state['field-' + item.name]} onChange={(e) => this.setState({ ['field-' + item.name]: e.target.value })}></textarea>
      } else if (item.type === 'group') {
        return <div key={item.name} className='card' style={{ marginBottom: 20 }}>
          <div className='card-header'>
            <div className='card-header-title'>{item.name}</div>
          </div>
          <div className='card-content'>
            {this.generateFields(item.fields)}
          </div>
        </div>
      } else if (item.type === 'component') {
        return <div key={item.name}>{item.content}</div>
      } else if (item.type === 'multiselect') {
        if (this.state.mounted) {
          inpt = <Select
            key={item.name}
            placeholder={item.placeholder}
            isMulti={true}
            value={(this.state['field-' + item.name] || [])}
            options={item.choices.map(item.converter)}
            onChange={(opt) => this.setState({ ['field-' + item.name]: opt })}
            styles={{
              container: (style) => ({
                ...style,
                width: '100%'
              })
            }}
          />
        } else {
          inpt = <div>Loading...</div>
        }
      } else if (item.type === 'checkbox') {
        inpt = <label className='checkbox'>
          <input type='checkbox' checked={this.state['field-' + item.name]} onChange={(e) => this.setState({ ['field-' + item.name]: e.target.checked })} /> {item.label}
        </label>
      } else {
        inpt = <span style={{ color: 'red' }}>Unknown field type '{item.type}'!</span>
      }

      return <div key={item.name} className='field is-horizontal'>
        <div className='field-label is-normal'>
          <label className='label'>{item.type === 'checkbox' ? titleize(item.name) : item.label || titleize(item.name)}{item.required && <span style={{ color: 'red' }}>*</span>}</label>
        </div>
        <div className='field-body'>
          <div className='field'>
            <div className='control'>
              {inpt}
            </div>
            {item.help && <p className='help'>{item.help}</p>}
          </div>
        </div>
      </div>
    })
  }

  render() {
    return <span>
      {this.generateFields(this.props.fields)}
      <a className='button is-primary is-medium' onClick={() => this.props.onSubmit && this.props.onSubmit(this.getData())}>Submit</a>
    </span>
  }
}

export default Form
