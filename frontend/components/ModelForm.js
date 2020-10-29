import { Component } from 'react'
import s from 'styled-components'

import {
  doApiRequest,
  formatResponse,
  getApiUrl,
  getRoleDisplay,
  titleize,
} from '../utils'
import { Icon, Loading } from './common'
import Form from './Form'

const ModelItem = s.div`
  padding: 15px;
  border: 1px solid #dbdbdb;
  border-radius: 3px;
  margin-bottom: 1em;
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
      createObject:
        props.defaultObject != null ? { ...props.defaultObject } : {},
      newCount: 0,
    }

    this.onSubmit = this.onSubmit.bind(this)
    this.onDelete = this.onDelete.bind(this)
    this.onCreate = this.onCreate.bind(this)
    this.onChange = this.onChange.bind(this)
  }

  /**
   * This is called when the create/edit form has its contents changed.
   */
  onChange(obj) {
    if (this.props.onChange) {
      this.props.onChange(obj)
    }
  }

  onCreate() {
    this.setState(({ objects, newCount }) => {
      objects.push({
        tempId: newCount,
        ...(this.props.defaultObject ?? {}),
      })
      return { objects, newCount: newCount + 1 }
    })
  }

  onDelete(object) {
    const { baseUrl, keyField = 'id' } = this.props

    if (typeof object[keyField] !== 'undefined') {
      doApiRequest(`${baseUrl}${object[keyField]}/?format=json`, {
        method: 'DELETE',
      }).then((resp) => {
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
    const fileFields = fields.filter(
      (f) => f.type === 'file' || f.type === 'image',
    )
    const fileData = {}
    fileFields.forEach(({ name }) => {
      if (data[name] !== null) {
        fileData[name] = data[name]
        delete data[name]
      }
    })

    // if object was deleted, return
    if (object == null) {
      return new Promise((resolve) => {
        resolve({
          _status: false,
          _error_message:
            'This object hass already been deleted and cannot be saved.',
        })
      })
    }

    // create or edit the object, uploading all non-file fields
    const savePromise =
      typeof object[keyField] === 'undefined'
        ? doApiRequest(`${baseUrl}?format=json`, {
            method: 'POST',
            body: data,
          })
            .then((resp) => {
              if (resp.ok) {
                object._status = true
                return resp.json().then((resp) => {
                  Object.keys(resp).forEach((key) => {
                    object[key] = resp[key]
                  })
                })
              } else {
                object._status = false
                return resp.json().then((resp) => {
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
            .then((resp) => {
              object._status = resp.ok
              return resp.json()
            })
            .then((resp) => {
              if (object._status) {
                Object.keys(resp).forEach((key) => {
                  object[key] = resp[key]
                })
                object._error_message = null
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
                  },
                )
              }
              return null
            })
            .filter((a) => a !== null),
        )
      })
      .then(() => {
        return object
      })
  }

  componentDidMount() {
    doApiRequest(
      `${this.props.baseUrl}?format=json${this.props.listParams ?? ''}`,
    )
      .then((resp) => resp.json())
      .then((resp) => {
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
      allowEditing = true,
      allowDeletion = true,
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
          : objects.findIndex((a) => a[keyField] === currentlyEditing)
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
                      {allowEditing && (
                        <button
                          onClick={() => {
                            this.setState({
                              currentlyEditing: object[keyField],
                            })
                            this.onChange(object)
                          }}
                          className="button is-primary is-small"
                        >
                          <Icon name="edit" alt="edit" /> Edit
                        </button>
                      )}
                      {allowDeletion && (
                        <button
                          onClick={() => {
                            if (confirmDeletion) {
                              if (
                                confirm(
                                  `Are you sure you want to ${deleteVerb.toLowerCase()} this ${noun.toLowerCase()}?`,
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
                      )}
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
                ref="currentForm"
                key={currentlyEditing}
                fields={fields}
                defaults={currentObject}
                onChange={() => {
                  const data = this.refs.currentForm.getSubmitData()
                  data._original = currentObject
                  this.onChange(data)
                }}
                errors={
                  currentObject &&
                  currentObject._status === false &&
                  currentObject._error_message
                }
                onSubmit={(data) => {
                  if (currentObjectIndex !== -1) {
                    objects[currentObjectIndex] = currentObject
                  }
                  this.onSubmit(currentObject, data).then((obj) => {
                    if (obj._status) {
                      if (currentlyEditing === null) {
                        objects.push(obj)
                      }
                      this.setState({
                        objects: [...objects],
                        currentlyEditing: obj[keyField],
                        createObject:
                          this.props.defaultObject != null
                            ? { ...this.props.defaultObject }
                            : {},
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
                    <span
                      className="button is-primary"
                      disabled={currentObject == null}
                    >
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
              onClick={() => {
                this.setState({
                  currentlyEditing: null,
                  getApiUrl,
                  formatResponse,
                  getRoleDisplay,
                  createObject:
                    this.props.defaultObject != null
                      ? { ...this.props.defaultObject }
                      : {},
                })
                this.onChange({})
              }}
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
          <ModelStatus status={currentObject?._status} />
          {currentObject?._error_message && (
            <div style={{ color: 'red', marginTop: '1rem' }}>
              <Icon name="alert-circle" />{' '}
              {typeof currentObject._error_message === 'object' &&
                'Errors occured while processing your request:'}
              {formatResponse(currentObject._error_message)}
            </div>
          )}
        </>
      )
    }

    return (
      <>
        {objects.map((object) => (
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
              errors={
                object && object._status === false && object._error_message
              }
              submitButton={
                <span className="button is-primary">
                  <Icon name="edit" alt="save" /> Save
                </span>
              }
              onSubmit={(data) => this.onSubmit(object, data)}
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
        {allowCreation && (
          <span onClick={this.onCreate} className="button is-primary">
            <Icon name="plus" alt="create" /> Create
          </span>
        )}
        {objects.length === 0 && this.props.empty}
      </>
    )
  }
}

export default ModelForm
