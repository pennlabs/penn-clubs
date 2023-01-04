import { ChangeEvent, createRef, ReactElement } from 'react'
import styled from 'styled-components'

import { CLUBS_RED } from '../../constants/colors'
import { Icon } from './Icon'

// Hide checkbox visually but remain accessible to screen readers.
// Source: https://polished.js.org/docs/#hidevisually
const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  border: 0;
  clip: rect(0 0 0 0);
  clippath: inset(50%);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`

const StyledCheckbox = styled.div<{ color?: string }>`
  display: inline-block;
  width: 16px;
  height: 16px;
  transition: all 150ms;
  cursor: pointer;
  fill: ${(props) => props.color || CLUBS_RED};
`

const CheckboxContainer = styled.div`
  display: inline-block;
  vertical-align: middle;
`

export const CheckboxLabel = styled.label`
  cursor: pointer;
`

type CheckboxProps = {
  id?: string
  color?: string
  name?: string
  className?: string
  checked: boolean
  value?: string
  onBlur?: () => void
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  size?: string | undefined
}

export const Checkbox = ({
  className,
  checked,
  onChange,
  onBlur,
  value,
  id,
  name,
  color,
  size,
}: CheckboxProps): ReactElement => {
  const checkboxRef = createRef<HTMLInputElement>()

  return (
    <CheckboxContainer className={className}>
      <HiddenCheckbox
        ref={checkboxRef}
        checked={checked}
        onChange={onChange}
        value={value}
        onBlur={onBlur}
        id={id}
        name={name}
        type="checkbox"
      />
      <StyledCheckbox
        color={color}
        onClick={() => checkboxRef.current?.click()}
      >
        <Icon
          size={size}
          noAlign
          alt={checked ? 'checked' : 'unchecked'}
          name={checked ? 'check-box' : 'box'}
        />
      </StyledCheckbox>
    </CheckboxContainer>
  )
}
