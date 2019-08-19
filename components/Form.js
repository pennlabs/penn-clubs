import React from 'react'
import { EditorState, ContentState, convertFromHTML, convertToRaw } from 'draft-js'
import { Editor } from 'react-draft-wysiwyg'
import { titleize } from '../utils'
import draftToHtml from 'draftjs-to-html'
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
      if (item.type == 'html') {
        if (this.props.defaults[item.name]) {
          this.state['editorState-' + item.name] = EditorState.createWithContent(
            ContentState.createFromBlockArray(
              convertFromHTML(this.props.defaults[item.name])
            )
          )
        }
        else {
          this.state['editorState-' + item.name] = EditorState.createEmpty()
        }
      }
      if (item.type !== 'group') {
        this.state['field-' + item.name] = this.props.defaults ? this.props.defaults[item.name] || '' : ''
      }
      else {
        this.setDefaults(item.fields)
      }
    })
  }

  componentDidMount() {
    this.setState({
      mounted: true
    })
  }

  getData() {
    const out = {}
    Object.keys(this.state).forEach((key) => {
      if (key.startsWith("field-")) {
        out[key.substr(6)] = this.state[key]
      }
    })
    return out
  }

  generateFields(fields) {
    return fields.map((item) => {
      var inpt = null
      if (['text', 'url', 'email'].includes(item.type)) {
        inpt = <input className='input' value={this.state['field-' + item.name]} onChange={(e) => this.setState({ ['field-' + item.name]: e.target.value })} key={item.name} type={item.type} name={item.name} />
      }
      else if (item.type == 'html') {
        inpt = <div>
          <Head>
            <link href='/static/css/react-draft-wysiwyg.css' rel='stylesheet' key='editor-css' />
          </Head>
          {this.state.mounted ? <Editor
            editorState={this.state['editorState-' + item.name]}
            placeholder='Type your club description here!'
            onEditorStateChange={(state) => {
              this.setState({ ['editorState-' + item.name]: state, ['field-' + item.name]: draftToHtml(convertToRaw(state.getCurrentContent())) })
            }}
          /> : <div>Loading...</div>}
        </div>
      }
      else if (item.type == 'textarea') {
        inpt = <textarea className='textarea' value={this.state['field-' + item.name]} onChange={(e) => this.setState({ ['field-' + item.name]: e.target.value })}></textarea>
      }
      else if (item.type == 'group') {
        return <div key={item.name} className='card' style={{ marginBottom: 20 }}>
          <div className='card-header'>
            <div className='card-header-title'>{item.name}</div>
          </div>
          <div className='card-content'>
            {this.generateFields(item.fields)}
          </div>
        </div>
      }
      else {
        inpt = <span style={{ color: 'red' }}>Unknown field type '{item.type}'!</span>
      }

      return <div key={item.name} className='field is-horizontal'>
        <div className='field-label is-normal'>
          <label className='label'>{titleize(item.name)}</label>
        </div>
        <div className='field-body'>
          {inpt}
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
