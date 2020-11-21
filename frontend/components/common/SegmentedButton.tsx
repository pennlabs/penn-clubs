import { ButtonHTMLAttributes, ReactElement } from 'react'
import s from 'styled-components'

import { Icon } from '../../components/common'
import { ANIMATION_DURATION } from '../../constants'

interface InnerButtonProps extends ButtonHTMLAttributes {
  icon?: string
  label?: string
  selected?: boolean
  key?: any
}

interface SegmentedButtonProps {
  buttons: InnerButtonProps[]
}

const Segment = s.div`
	display: block;
	border: solid #E5E5E5 1px;
	border-radius: 5px;
	overflow: hidden;
`

const InnerButton = s.button<InnerButtonProps>`
	color: #6F6F6F;
	background: ${(prop) => (prop.selected ? '#E5E5E5' : '#FFF')};
	outline: none;
	border: none;
	padding: 18px 25px;
	font-size: 18px;
	transition: all ${ANIMATION_DURATION};
	&:not(:last-child){
		border-right:  solid #E5E5E5 1px;
	}
	&:hover {
		cursor: pointer;
		background: #E5E5E5
	}
`

export const SegmentedButton = ({
  buttons,
}: SegmentedButtonProps): ReactElement => {
  return (
    <Segment>
      {buttons.map(({ label, selected, icon, ...rest }) => (
        <InnerButton selected={selected} {...rest}>
          {icon && <Icon name={icon} />}
          {label}
        </InnerButton>
      ))}
    </Segment>
  )
}
