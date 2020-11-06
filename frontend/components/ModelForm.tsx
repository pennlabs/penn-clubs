import { Form, Formik } from 'formik'
import { ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { doApiRequest, formatResponse, titleize } from '../utils'
import { Icon, Loading } from './common'
import { FormStyle } from './FormComponents'

const ModelItem = styled.div`
 padding: 15px;
 border: 1px solid #dbdbdb;
 border-radius: 3px;
 margin-bottom: 1em;
`

const ModelStatusWrapper = styled.span`
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

const Subtitle = styled.div`
 font-weight: bold;
 font-size: 1.2em;
 margin-bottom: 0.75em;
`

type ModelObject = { [key: string]: any }

type TableField = {
  label?: string
  name: string
  converter?: (field: any, object: ModelObject) => any
}

type ModelFormProps = {
  listParams?: string
  initialData?: ModelObject[]
  baseUrl: string
  keyField?: string
  onChange?: (object: ModelObject) => void
  defaultObject?: ModelObject
  fileFields?: string[]
  empty?: ReactElement | string
  fields: any
  tableFields?: TableField[]
  currentTitle?: (object: ModelObject) => ReactElement | string

  noun?: string
  deleteVerb?: string
  allowCreation?: boolean
  allowEditing?: boolean
  allowDeletion?: boolean
  confirmDeletion?: boolean
}

/**
 * The initial values returned by Django usually have a "field_url" attribute for some field,
 * instead of "field", where field is a file or image field. In these cases, we modify
 * the field to remove this suffix if the field does not exist in the data.
 */
export const doFormikInitialValueFixes = (currentObject: {
  [key: string]: any
}): { [key: string]: any } => {
  return Object.entries(currentObject).reduce((prev, [key, val]) => {
    if (key.endsWith('_url')) {
      const otherKey = key.substr(0, key.length - 4)
      if (!(otherKey in prev)) {
        prev[otherKey] = val
      }
    }
    prev[key] = val
    return prev
  }, {})
}

type ModelTableProps = {
  tableFields: TableField[]
  objects: ModelObject[]
  allowEditing?: boolean
  allowDeletion?: boolean
  confirmDeletion?: boolean
  noun?: string
  deleteVerb?: string
  onEdit?: (object: ModelObject) => void
  onDelete?: (object: ModelObject) => void
}

/**
 * Render a list of objects as a table.
 */
export const ModelTable = ({
  tableFields,
  objects,
  allowEditing = false,
  allowDeletion = false,
  confirmDeletion = false,
  noun = 'Object',
  deleteVerb = 'Delete',
  onEdit = () => undefined,
  onDelete = () => undefined,
}: ModelTableProps): ReactElement => {
  return (
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
        {objects.map(
          (object, i: number): ReactElement => (
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
                      onClick={() => onEdit(object)}
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
                            onDelete(object)
                          }
                        } else {
                          onDelete(object)
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
          ),
        )}
      </tbody>
    </table>
  )
}

type Props = {
  ModelFormProps: any
  ModelFormState: boolean
}

/*
 * Creates a form with CRUD (create, read, update, delete)
 * capabilities for a Django model using a provided endpoint.
 */
export const ModelForm = (props: ModelFormProps) => {
  const [objects, changeObjects] = useState<ModelObject[]>([])
  const [
    currentlyEditing,
    changeCurrentlyEditing,
  ] = useState<ModelObject | null>(null)
  const [newCount, changeNewCount] = useState<number>(0)
  const [createObject, changeCreateObject] = useState<ModelObject>(
    props.defaultObject != null ? { ...props.defaultObject } : {},
  )

  /**
   * This is called when the create/edit form has its contents changed.
   */
  const onChange = (obj): void => {
    if (props.onChange) {
      props.onChange(obj)
    }
  }

  /**
   * Called when the user wants to create a new object.
   * Does not save the object to the database.
   */
  const onCreate = (): void => {
    const newObjects: ModelObject[] = objects
    newObjects.push({
      tempId: newCount,
      ...(props.defaultObject ?? {}),
    })
    changeObjects(newObjects)
    changeNewCount(newCount + 1)
  }

  /**
   * Called when the user requests for an object to be deleted.
   * @param object The object that should be deleted.
   */
  const onDelete = (object): void => {
    const { baseUrl, keyField = 'id' } = props

    if (typeof object[keyField] !== 'undefined') {
      doApiRequest(`${baseUrl}${object[keyField]}/?format=json`, {
        method: 'DELETE',
      }).then((resp) => {
        if (resp.ok) {
          const newObjects: ModelObject[] = [...objects]
          newObjects.splice(objects.indexOf(object), 1)
          changeObjects(newObjects)
        }
      })
    } else {
      const newObjects: ModelObject[] = [...objects]
      newObjects.splice(objects.indexOf(object), 1)
      changeObjects(newObjects)
    }
  }

  /**
   * Called when the form is submitted to save an individual object.
   * @returns a promise with the first argument as the new object values.
   */
  const onSubmit = (object, data): Promise<any> => {
    const { baseUrl, keyField = 'id' } = props

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

    const formData = Object.keys(data).reduce((flt, key) => {
      if (
        !(data[key] instanceof File) &&
        !(
          props.fileFields &&
          props.fileFields.includes(key) &&
          data[key] !== null
        )
      ) {
        flt[key] = data[key]
      }
      return flt
    }, {})

    // create or edit the object, uploading all non-file fields
    const savePromise =
      typeof object[keyField] === 'undefined'
        ? doApiRequest(`${baseUrl}?format=json`, {
            method: 'POST',
            body: formData,
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
              changeObjects([...objects])
            })
        : doApiRequest(`${baseUrl}${object[keyField]}/?format=json`, {
            method: 'PATCH',
            body: formData,
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
              changeObjects([...objects])
            })

    // upload all files in the form
    return savePromise
      .then(() => {
        return Promise.all(
          Object.entries(data)
            .map(([key, value]) => {
              if (!(value instanceof File)) {
                return null
              }
              const fieldData = new FormData()
              fieldData.append(key, value)
              return doApiRequest(
                `${baseUrl}${object[keyField]}/?format=json`,
                {
                  method: 'PATCH',
                  body: fieldData,
                },
              )
            })
            .filter((a) => a !== null),
        )
      })
      .then(() => {
        return object
      })
  }

  /**
   * Download the latest list of objects when the component is mounted.
   */
  useEffect(() => {
    doApiRequest(`${props.baseUrl}?format=json${props.listParams ?? ''}`)
      .then((resp) => resp.json())
      .then((resp) => {
        changeObjects(resp)
      })
  }, [])

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
    onChange: parentComponentChange,
  } = props

  if (!objects) {
    return <Loading />
  }

  if (tableFields) {
    const currentObjectIndex =
      currentlyEditing === null
        ? -1
        : objects.findIndex((a) => a[keyField] === currentlyEditing)
    const currentObject =
      currentlyEditing === null ? createObject : objects[currentObjectIndex]

    return (
      <>
        <ModelTable
          onEdit={(object): void => {
            changeCurrentlyEditing(object[keyField])
            onChange(object)
          }}
          onDelete={onDelete}
          deleteVerb={deleteVerb}
          noun={noun}
          tableFields={tableFields}
          objects={objects}
          allowDeletion={allowDeletion}
          confirmDeletion={confirmDeletion}
          allowEditing={allowEditing}
        />
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
            <Formik
              validate={parentComponentChange}
              initialValues={doFormikInitialValueFixes(currentObject)}
              initialStatus={
                currentObject &&
                currentObject._status === false &&
                currentObject._error_message
              }
              onSubmit={(data) => {
                if (currentObjectIndex !== -1) {
                  objects[currentObjectIndex] = currentObject
                }
                onSubmit(currentObject, data).then((obj: any) => {
                  if (obj._status) {
                    if (currentlyEditing === null) {
                      objects.push(obj)
                    }
                    changeObjects([...objects])
                    changeCurrentlyEditing(obj[keyField])
                    changeCreateObject(
                      props.defaultObject != null
                        ? { ...props.defaultObject }
                        : {},
                    )
                  } else {
                    changeCreateObject(obj)
                  }
                })
              }}
              enableReinitialize
            >
              {({ isSubmitting }) => (
                <Form>
                  <FormStyle isHorizontal>
                    {fields}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="button is-primary"
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
                    </button>

                    {currentlyEditing !== null && (
                      <span
                        onClick={() => {
                          changeCreateObject(
                            props.defaultObject != null
                              ? { ...props.defaultObject }
                              : {},
                          )
                          changeCurrentlyEditing(null)
                          onChange({})
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
                  </FormStyle>
                </Form>
              )}
            </Formik>
          </>
        )}

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
          <Formik
            initialValues={object}
            initialStatus={
              object && object._status === false && object._error_message
            }
            onSubmit={(data) => onSubmit(object, data)}
            enableReinitialize
          >
            {({ isSubmitting }) => (
              <Form>
                <FormStyle isHorizontal>
                  {fields}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="button is-primary"
                  >
                    <Icon name="edit" alt="save" /> Save
                  </button>
                  <span
                    className="button is-danger"
                    style={{ marginLeft: '0.5em' }}
                    onClick={() => onDelete(object)}
                  >
                    <Icon name="trash" alt="trash" /> Delete
                  </span>
                  <ModelStatus status={object._status} />
                </FormStyle>
              </Form>
            )}
          </Formik>
        </ModelItem>
      ))}
      {allowCreation && (
        <span onClick={onCreate} className="button is-primary">
          <Icon name="plus" alt="create" /> Create
        </span>
      )}
      {objects.length === 0 && props.empty}
    </>
  )
}

export default ModelForm
