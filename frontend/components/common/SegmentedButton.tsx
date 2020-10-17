import { ButtonHTMLAttributes, ReactElement } from 'react'
import s from 'styled-components'

import { ANIMATION_DURATION } from '../../constants'

interface InnerButtonProps extends ButtonHTMLAttributes {
  label: string
  selected?: boolean
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
      {buttons.map(({ label, selected, ...rest }) => (
        <InnerButton selected={selected} {...rest}>
          {label}
        </InnerButton>
      ))}
    </Segment>
  )
}
