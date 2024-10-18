import { AtomicBlockUtils, EditorState } from 'draft-js'
import { ReactElement, useState } from 'react'

import { ModalContent } from './ClubPage/Actions'
import { Contact, Icon, Modal } from './common'

type Props = {
  editorState?: EditorState
  onChange?: (state: EditorState) => void
}

type Entity = {
  type: string
  mutability: 'MUTABLE' | 'IMMUTABLE'
  data: any
}

const MediaComponent = (props): ReactElement => {
  const data = props.contentState
    .getEntity(props.block.getEntityAt(0))
    .getData()

  return (
    <iframe
      src={data.src ?? 'about:blank'}
      style={{ width: data.width ?? '100%', height: data.height }}
    />
  )
}

export const htmlToEntity = (
  nodename: string,
  node: HTMLElement,
): Entity | void => {
  if (nodename === 'iframe') {
    return {
      type: 'EMBED',
      mutability: 'IMMUTABLE',
      data: {
        src: node.getAttribute('src'),
        width: node.getAttribute('width'),
        height: node.getAttribute('height'),
      },
    }
  }
}

export const entityToHtml = (entity: Entity): string | void => {
  if (entity.type === 'EMBED') {
    const ele = document.createElement('iframe')
    ele.setAttribute('src', entity.data.src ?? 'about:blank')
    ele.setAttribute('width', entity.data.width ?? '100%')
    ele.setAttribute('height', entity.data.height)
    return ele.outerHTML
  }
}

/**
 * Custom rendering for custom components.
 */
export const blockRendererFunction = (
  block,
  config,
):
  | { component: (props: any) => ReactElement; editable: boolean }
  | undefined => {
  if (block.getType() === 'atomic') {
    const contentState = config.getEditorState().getCurrentContent()
    const entity = contentState.getEntity(block.getEntityAt(0))
    if (entity && entity.type === 'EMBED') {
      return {
        component: MediaComponent,
        editable: false,
      }
    }
  }
}

/**
 * A toolbar widget for the editor to embed interactive content, like iframes.
 */
const EmbedOption = (props: Props): ReactElement => {
  const [showModal, setShowModal] = useState<boolean>(false)

  const [embedUrl, setEmbedUrl] = useState<string>('')
  const [embedWidth, setEmbedWidth] = useState<string>('100%')
  const [embedHeight, setEmbedHeight] = useState<string>('1200px')
  const [errorMessage, setErrorMessage] = useState<
    ReactElement | string | null
  >(null)

  const embedContent = (embedUrl: string) => {
    if (!embedUrl.length) {
      setErrorMessage('You must specify a valid URL.')
      return false
    }

    if (/\.(?:png|svg|jpg|jpeg)$/.test(embedUrl)) {
      setErrorMessage(
        <>
          If you would like to embed an image file, please use the image
          functionality found in the toolbar (<Icon name="image" />) instead.
        </>,
      )
      return false
    }

    if (/^\s*<iframe/.test(embedUrl)) {
      const matches = embedUrl.match(/src=['"](.*?)['"]/)
      if (matches == null) {
        setErrorMessage(
          'Please only specify the URL in the input, not the entire embedding code.',
        )
        return false
      }
      embedUrl = matches[1]
      setEmbedUrl(embedUrl)
    }

    if (!/^https?:\/\//.test(embedUrl)) {
      setErrorMessage(
        'The URL you are using must start with http:// or https://.',
      )
      return false
    }

    if (!/^\s*\d+(?:%|px|em|rem|vw)\s*$/.test(embedWidth)) {
      setErrorMessage('You must specify a valid embedding width.')
      return false
    }

    if (!/^\s*\d+(?:px|em|rem|vh)\s*$/.test(embedHeight)) {
      setErrorMessage('You must specify a valid embedding height.')
      return false
    }

    const { editorState, onChange } = props

    if (editorState == null) {
      setErrorMessage(
        'There is no editor state available, this should not happen!',
      )
      return false
    }

    const contentState = editorState.getCurrentContent()
    const contentStateWithEntity = contentState.createEntity(
      'EMBED',
      'IMMUTABLE',
      { src: embedUrl, width: embedWidth, height: embedHeight },
    )
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
    const newState = AtomicBlockUtils.insertAtomicBlock(
      editorState,
      entityKey,
      ' ',
    )
    onChange != null &&
      onChange(
        EditorState.forceSelection(
          newState,
          newState.getCurrentContent().getSelectionAfter(),
        ),
      )
    return true
  }

  return (
    <>
      <div
        className="rdw-option-wrapper"
        title="Embed Content"
        onClick={() => setShowModal(true)}
      >
        <Icon name="package" />
      </div>
      <Modal
        show={showModal}
        closeModal={() => setShowModal(false)}
        marginBottom={false}
        width="80%"
      >
        <ModalContent>
          <h1>Embed Content</h1>
          <p>
            You can use this tool to embed multimedia content into your club
            mission. If you run into any issues using the tool, please contact{' '}
            <Contact />. Here are examples of some of the things you can embed.
          </p>
          <div className="content mb-3">
            <ul>
              <li>
                Youtube Videos
                <br />
                <small>
                  Click on the Youtube share button, select embed, and copy only
                  the URL portion of the code they give you. Example link
                  format: https://www.youtube.com/embed/dQw4w9WgXcQ
                </small>
              </li>
              <li>
                Google Drive PDF Files
                <br />
                <small>
                  You can upload a PDF file on Google Drive, share it
                  publically, and then go to right click &gt; Preview &gt; More
                  actions (three dots) &gt; Open in a new window. After that,
                  you can click on More actions (three dots) &gt; Embed item.
                  Example link format:
                  https://drive.google.com/file/d/1hfN3dWDIE4cTApJ-XPgLx_3eIta_IihV/preview
                </small>
              </li>
              <li>
                Popular Web Services
                <br />
                <small>
                  <a
                    target="_blank"
                    href="https://support.google.com/a/users/answer/9308623?hl=en"
                  >
                    Google Forms
                  </a>
                  ,{' '}
                  <a
                    target="_blank"
                    href="https://developers.facebook.com/docs/plugins/page-plugin/"
                  >
                    Facebook Posts
                  </a>
                  , Google Maps,{' '}
                  <a
                    target="_blank"
                    href="https://support.google.com/calendar/answer/41207?hl=en"
                  >
                    Google Calendars
                  </a>
                  ,{' '}
                  <a target="_blank" href="https://twitframe.com/">
                    Twitter Tweets
                  </a>
                </small>
              </li>
              <li>
                Any Website Page
                <br />
                <small>
                  You can embed any website page using this form. Note that you
                  may need to configure your website to allow it to be embedded
                  in an iframe. If the website is not common, you will need to
                  contact <Contact /> to get it added to the allowlist. Example
                  link format: https://xkcd.com/
                </small>
              </li>
            </ul>
          </div>
          <p>You can enter the URL of the content you want to embed below.</p>
          <div className="field mb-3">
            <label className="label">URL</label>
            <input
              type="text"
              className="input"
              placeholder="Your URL"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              onBlur={() => {
                if (/^https?:\/\/(?:www\.)?youtube\.com\//.test(embedUrl)) {
                  setEmbedWidth('560px')
                  setEmbedHeight('315px')
                }
              }}
            />
          </div>
          <div className="field mb-3">
            <label className="label">Width</label>
            <input
              type="text"
              className="input"
              placeholder="Embed Width"
              value={embedWidth}
              onChange={(e) => setEmbedWidth(e.target.value)}
            />
            <p className="help">
              You can specify this in pixel units (ex: 600px) or as a percentage
              of width (ex: 100%).
            </p>
          </div>
          <div className="field mb-">
            <label className="label">Height</label>
            <input
              type="text"
              className="input"
              placeholder="Embed Height"
              value={embedHeight}
              onChange={(e) => setEmbedHeight(e.target.value)}
            />
            <p className="help">
              You can specify this in pixel units (ex: 1000px).
            </p>
          </div>
          {errorMessage !== null && (
            <p className="has-text-danger">{errorMessage}</p>
          )}
          <div className="mt-3">
            <button
              type="button"
              className="button is-success"
              style={{ height: 24 }}
              onClick={() => {
                if (embedContent(embedUrl)) {
                  setShowModal(false)
                }
              }}
            >
              <Icon name="package" /> Embed
            </button>
          </div>
        </ModalContent>
      </Modal>
    </>
  )
}

export default EmbedOption
