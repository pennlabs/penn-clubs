import { EditorState } from 'draft-js'
import { ReactElement, useState } from 'react'

import { ModalContent } from './ClubPage/Actions'
import { Icon, Modal } from './common'

type Props = {
  editorState?: EditorState
  onChange?: (state: EditorState) => void
}

type Entity = {
  type: string
  mutability: 'MUTABLE' | 'IMMUTABLE'
  data: any
}

/**
 * A toolbar widget for the editor to add custom variables to personalized outcome notifications.
 */
const CustomOption = (props: Props): ReactElement => {
  const [showModal, setShowModal] = useState<boolean>(false)

  const [variableSelected, setVariableSelected] = useState<string>('name')
  const [errorMessage, setErrorMessage] = useState<
    ReactElement | string | null
  >(null)

  const helperText = String.raw`
  Hi {{ name }}, you have been invited to join our club on {{ date }}.

  We were very impressed by your initiative and admitted you into the club because of it. 
            
  {{ reason }}

  Congratulations!
  `

  return (
    <>
      <div
        className="rdw-option-wrapper"
        title="Use Custom Variable"
        onClick={() => setShowModal(true)}
      >
        <Icon name="award" /> Sample Email!
      </div>
      <Modal
        show={showModal}
        closeModal={() => setShowModal(false)}
        marginBottom={false}
        width="80%"
        height="40%"
      >
        <ModalContent>
          <h1>Sample Email</h1>
          <pre>{helperText}</pre>
          <p className="help">
            (note: don't use any variables other than the ones used here!)
          </p>
          {errorMessage !== null && (
            <p className="has-text-danger">{errorMessage}</p>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}

export default CustomOption
