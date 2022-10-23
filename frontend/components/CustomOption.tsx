import { EditorState } from 'draft-js'
import { ReactElement, useState } from 'react'
import Select from 'react-select'

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

const options = [
  { value: 'name', label: 'Name' },
  { value: 'date', label: 'Date' },
  { value: 'reason', label: 'Reason' },
]

/**
 * A toolbar widget for the editor to add custom variables to personalized outcome notifications.
 */
const CustomOption = (props: Props): ReactElement => {
  const [showModal, setShowModal] = useState<boolean>(false)

  const [variableSelected, setVariableSelected] = useState<string>('name')
  const [errorMessage, setErrorMessage] = useState<
    ReactElement | string | null
  >(null)

  return (
    <>
      <div
        className="rdw-option-wrapper"
        title="Use Custom Variable"
        onClick={() => setShowModal(true)}
      >
        <Icon name="award" /> Customize
      </div>
      <Modal
        show={showModal}
        closeModal={() => setShowModal(false)}
        marginBottom={false}
        width="80%"
        height="40%"
      >
        <ModalContent>
          <h1>Use a custom variable below:</h1>
          <div className="field mb-">
            <label className="label">Choose from the following.</label>
            <Select options={options} />
          </div>
          {errorMessage !== null && (
            <p className="has-text-danger">{errorMessage}</p>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}

export default CustomOption
