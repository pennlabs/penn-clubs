import 'react-datepicker/dist/react-datepicker.css'

import { ContentState, convertToRaw, EditorState } from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import { useFormikContext } from 'formik'
import Head from 'next/head'
import React, {
  ReactElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
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

/**
 * All form fields should accept these properties.
 *
 * The form fields should render with Bulma styling in mind.
 */
interface BasicFormField {
  name: string
  label?: string
  helpText?: string
  placeholder?: string
  noLabel?: boolean
}

/**
 * This interface allows for completely arbitrary props
 * to be passed to any of the form inputs.
 *
 * The ideal solution would be to explicitly define what
 * props each form field accepts.
 *
 * This is used for now so that we can at least guarantee
 * that a form field has the basic properties expected
 * of all form fields.
 */
interface AnyHack {
  [key: string]: any
}

const FormFieldClassContext = React.createContext<string>('')

/**
 * To style all fields inside of a Formik form, wrap all fields with this component.
 *
 * @param isHorizontal Use the Bulma horizontal layout for form fields.
 */
export const FormStyle = ({
  children,
  isHorizontal,
}: React.PropsWithChildren<{ isHorizontal?: boolean }>): ReactElement => {
  if (!isHorizontal) {
    return <>{children}</>
  }

  return (
    <FormFieldClassContext.Provider value="is-horizontal">
      {children}
    </FormFieldClassContext.Provider>
  )
}

/**
 * This field wrapper is used to automatically add labels and help texts
 * for most components. The components that use this wrapper only need
 * to specify the input itself.
 */
const useFieldWrapper = (Element): ((props: any) => ReactElement) => {
  return (props: React.PropsWithChildren<BasicFormField & AnyHack>) => {
    const { label, noLabel, helpText, ...other } = props
    const { status } = useFormikContext()
    const actualLabel = label ?? titleize(props.name)
    const errorMessage = status && status[props.name]
    const fieldContext = useContext(FormFieldClassContext)
    const isHorizontal = fieldContext.includes('is-horizontal')

    const fieldLabel = (
      <label className="label">
        {actualLabel}
        {props.required && <span style={{ color: 'red' }}>*</span>}
      </label>
    )

    const fieldBody = (
      <>
        <div className="control">
          <Element {...other} isError={!!errorMessage} />
        </div>
        <p className={`help ${errorMessage ? 'is-danger' : ''}`}>
          {errorMessage || helpText}
        </p>
      </>
    )

    return (
      <div className={`field ${fieldContext}`}>
        {noLabel ||
          (isHorizontal ? (
            <div className="field-label">{fieldLabel}</div>
          ) : (
            fieldLabel
          ))}
        {isHorizontal ? (
          <div className="field-body">
            <div className="field">{fieldBody}</div>
          </div>
        ) : (
          fieldBody
        )}
      </div>
    )
  }
}

/**
 * We can only initialize these properties on the client side.
 * Disable them for server side rendering or errors will be thrown.
 */
let htmlToDraft: any = null
let Editor: ((props: any) => ReactElement) | null = null
if (process.browser) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  htmlToDraft = require('html-to-draftjs').default
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Editor = require('react-draft-wysiwyg').Editor
}

/**
 * A rich text editor that accepts and outputs HTML.
 */
export const RichTextField = useFieldWrapper(
  (props: BasicFormField & AnyHack): ReactElement => {
    const { setFieldValue } = useFormikContext()
    const textValue = useRef<string | null>(null)

    const [editorState, setEditorState] = useState(() =>
      EditorState.createEmpty(),
    )

    useEffect(() => {
      if (
        props.value &&
        props.value.length &&
        props.value !== textValue.current
      ) {
        setEditorState(
          EditorState.createWithContent(
            ContentState.createFromBlockArray(
              htmlToDraft(props.value, htmlToEntity).contentBlocks,
            ),
          ),
        )
        textValue.current = props.value
      }
    }, [props.value])

    return (
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
        {Editor != null && (
          <Editor
            editorState={editorState}
            placeholder={props.placeholder}
            onEditorStateChange={(state) => {
              setEditorState(state)
              const newValue = draftToHtml(
                convertToRaw(state.getCurrentContent()),
                undefined,
                undefined,
                entityToHtml,
              )
              textValue.current = newValue
              setFieldValue(props.name, newValue)
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
        )}
      </div>
    )
  },
)

const DatePickerWrapper = s.span`
  & .react-datepicker-wrapper {
    width: 100%;
  }
`

/**
 * A datetime field that allows the user to choose a date and a time.
 */
export const DateTimeField = useFieldWrapper(
  (props: BasicFormField & AnyHack): ReactElement => {
    const { name, value, placeholder, ...other } = props
    const { setFieldValue } = useFormikContext()

    return (
      <DatePickerWrapper>
        <DatePicker
          className="input"
          showTimeSelect
          dateFormat="MMMM d, yyyy h:mm aa"
          selected={Date.parse(value) || value}
          placeholderText={placeholder}
          {...other}
          onChange={(val) => {
            setFieldValue(name, val)
          }}
        />
      </DatePickerWrapper>
    )
  },
)

/**
 * A field that allows the user to type in text.
 * @param type This can be used to override the type of the text input (for example, you can specify "email" or "date"). If you specify "textarea", a textarea will be rendered instead.
 */
export const TextField = useFieldWrapper(
  (props: BasicFormField & AnyHack): ReactElement => {
    const { type = 'text', isError, value, ...other } = props

    return type === 'textarea' ? (
      <textarea
        className={`textarea ${isError ? 'is-danger' : ''}`}
        value={value ?? ''}
        {...other}
      ></textarea>
    ) : (
      <input
        className={`input ${isError ? 'is-danger' : ''}`}
        type={type}
        value={value != null ? value.toString() : ''}
        {...other}
      />
    )
  },
)

/**
 * A field that allows the user to upload a file.
 * If an image is uploaded, the image will be shown as a preview.
 *
 * @param isImage Whether or not this file upload field is intended to accept images.
 * @param canDelete Whether or not images can be deleted instead of just replaced.
 */
export const FileField = useFieldWrapper(
  ({
    name,
    placeholder,
    onBlur,
    value,
    isImage = false,
    canDelete = false,
  }: BasicFormField & AnyHack): ReactElement => {
    const { setFieldValue, initialValues } = useFormikContext()

    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [newlyUploaded, setNewlyUploaded] = useState<boolean>(false)

    useEffect(() => {
      if (value === undefined) {
        setImageUrl((initialValues as any)[name])
        setNewlyUploaded(false)
      } else if (value === null) {
        setImageUrl(null)
        setNewlyUploaded(false)
      } else if (value instanceof File) {
        if (isImage) {
          const reader = new FileReader()
          reader.onload = (e) => {
            setImageUrl(e.target?.result as string)
          }
          reader.readAsDataURL(value)
          setNewlyUploaded(true)
        } else {
          setImageUrl(`FILE:${value.name}`)
        }
      } else {
        setImageUrl(value)
        setNewlyUploaded(false)
      }
    }, [value])

    return (
      <>
        {imageUrl &&
          (imageUrl.startsWith('FILE:') ? (
            <div className="mb-3">
              <Icon name="file" alt="file" /> {imageUrl.substr(5)}
            </div>
          ) : (
            <img style={{ maxWidth: 300 }} src={imageUrl} />
          ))}
        <div className="file">
          <label className="file-label">
            <input
              className="file-input"
              type="file"
              name={name}
              onChange={(e) => {
                if (e.target.files) {
                  setFieldValue(name, e.target.files[0])
                }
              }}
              onBlur={onBlur}
              placeholder={placeholder}
            />
            <span className="file-cta">
              <span className="file-label">
                Choose a {isImage ? 'image' : 'file'}...
              </span>
            </span>
          </label>
          {imageUrl && (canDelete || isImage) && (
            <button
              type="button"
              onClick={() => {
                setFieldValue(name, null)
              }}
              className="ml-3 button is-danger"
            >
              <Icon name="trash" /> Remove {isImage ? 'Image' : 'File'}
            </button>
          )}
        </div>
        {newlyUploaded && (
          <p className="is-size-7">(Submit this form to confirm upload)</p>
        )}
      </>
    )
  },
)

/**
 * A field that provides autosuggestions for address completion.
 *
 * If no Google API key is set, this will fall back to a text field.
 */
export const FormikAddressField = useFieldWrapper(
  (props: BasicFormField & AnyHack): ReactElement => {
    const { setFieldValue } = useFormikContext()
    return (
      <AddressField
        addressValue={props.value}
        changeAddress={(val) => setFieldValue(props.name, val)}
      />
    )
  },
)

/**
 * A field where you can select one or more tags from a list of tags.
 *
 * @param choices The choices that the user is allowed to select from.
 * @param isMulti If set to true, you can select more than one tag. Otherwise, you can only select one tag.
 */
export const MultiselectField = useFieldWrapper(
  ({
    name,
    choices,
    placeholder,
    value,
    onBlur,
    serialize,
    deserialize,
    valueDeserialize,
    isMulti,
  }: BasicFormField & AnyHack): ReactElement => {
    const { setFieldValue } = useFormikContext()

    const actualSerialize = (opt) => {
      if (opt == null) {
        return isMulti ? [] : null
      }
      if (serialize != null) {
        return Array.isArray(opt) ? opt.map(serialize) : serialize(opt)
      }
      return opt.map(({ value, label }) => ({
        id: value,
        name: label,
      }))
    }

    const actualDeserialize = (opt) => {
      if (opt == null) {
        return isMulti ? [] : null
      }
      if (deserialize != null) {
        return Array.isArray(opt) ? opt.map(deserialize) : deserialize(opt)
      }
      return opt.map((item) => {
        return {
          value: item.id ?? item.value,
          label: item.name ?? item.label,
        }
      })
    }

    return (
      <Select
        instanceId={name}
        key={name}
        placeholder={placeholder}
        isMulti={isMulti}
        value={(valueDeserialize ?? actualDeserialize ?? ((a) => a))(value)}
        options={actualDeserialize(choices)}
        onChange={(opt) => setFieldValue(name, actualSerialize(opt))}
        onBlur={onBlur}
        styles={{ container: (style) => ({ ...style, width: '100%' }) }}
      />
    )
  },
)

/**
 * A field that renders a single checkbox with a label.
 */
export const CheckboxField = (
  props: BasicFormField & AnyHack,
): ReactElement => {
  const { label, value, ...other } = props
  const { status } = useFormikContext()
  const errorMessage = status && status[props.name]
  const fieldContext = useContext(FormFieldClassContext)
  const isHorizontal = fieldContext.includes('is-horizontal')

  const innerBody = (
    <>
      <div className="control">
        <label className="checkbox">
          <input type="checkbox" checked={value} {...other} /> {label}
        </label>
      </div>
      {errorMessage && <p className="help is-danger">{errorMessage}</p>}
    </>
  )

  return (
    <div className={`field ${fieldContext}`}>
      {isHorizontal ? (
        <>
          <div className="field-label">
            <label className="label">{titleize(props.name)}</label>
          </div>
          <div className="field-body">{innerBody}</div>
        </>
      ) : (
        innerBody
      )}
    </div>
  )
}
