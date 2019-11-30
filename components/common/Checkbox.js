import s from 'styled-components'
import {Icon} from './Icon'

// Hide checkbox visually but remain accessible to screen readers.
// Source: https://polished.js.org/docs/#hidevisually
const HiddenCheckbox = s.input.attrs({ type: 'checkbox' })`
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

const StyledCheckbox = s.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  transition: all 150ms;
`

const CheckboxContainer = s.div`
  display: inline-block;
  vertical-align: middle;
`

const Checkbox = ({ className, checked, onChange, ...props }) => {
  return (
    <CheckboxContainer className={className}>
      <HiddenCheckbox checked={checked} onChange={onChange} {...props} />
      <StyledCheckbox onClick={onChange} checked={checked}>
        <Icon name={checked ? 'check-box-red' : 'box-red'} /> 
      </StyledCheckbox>
    </CheckboxContainer>
  )
}

export default Checkbox