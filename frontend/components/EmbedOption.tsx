import { AtomicBlockUtils, EditorState } from 'draft-js'
import { ReactElement } from 'react'

import { Icon, Modal } from './common'

type Props = {
  editorState: EditorState
  onChange: (state: any) => void
}

const MediaComponent = (props): ReactElement => {
  const data = props.contentState
    .getEntity(props.block.getEntityAt(0))
    .getData()

  return <iframe src={data.src ?? 'about:blank'} style={{ width: '100%' }} />
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
  const embedContent = () => {
    const { editorState, onChange } = props
    const contentState = editorState.getCurrentContent()
    const contentStateWithEntity = contentState.createEntity(
      'EMBED',
      'IMMUTABLE',
      { src: prompt('Enter URL to embed:') },
    )
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
    const newState = AtomicBlockUtils.insertAtomicBlock(
      editorState,
      entityKey,
      ' ',
    )
    onChange(
      EditorState.forceSelection(
        newState,
        newState.getCurrentContent().getSelectionAfter(),
      ),
    )
  }

  return (
    <>
      <div
        className="rdw-option-wrapper"
        title="Embed Content"
        onClick={embedContent}
      >
        <Icon name="package" />
      </div>
      <Modal></Modal>
    </>
  )
}

export default EmbedOption
