import { ReactElement } from 'react'
import styled, { CSSProperties } from 'styled-components'

const reqSvgs = require.context('../../public/static/img/icons', true, /\.svg$/)

type IconWrapperProps = {
  $noAlign?: boolean
  $noMargin?: boolean
}
const IconWrapper = styled.span<IconWrapperProps>`
  display: inline-block;
  vertical-align: ${({ $noAlign }) => ($noAlign ? 'baseline' : 'middle')};

  .button &,
  .dropdown-item & {
    margin-right: ${({ $noMargin }) => ($noMargin ? '0' : '0.25rem')};
  }

  & svg {
    display: block;
    margin: auto;
  }
`

type IconProps = {
  name: string
  alt?: string
  size?: string
  style?: CSSProperties
  className?: string
  show?: boolean
  onClick?: () => void
  noMargin?: boolean
  noAlign?: boolean
}

export const Icon = ({
  name,
  show = true,
  size = '1rem',
  noMargin,
  noAlign,
  ...props
}: IconProps): ReactElement | null => {
  const svg = reqSvgs(`./${name}.svg`)
  if (!show || !svg || !svg.default) {
    return null
  }
  const iconInfo = svg.default().props
  return (
    <IconWrapper $noAlign={noAlign} $noMargin={noMargin}>
      {svg.default({
        preserveAspectRatio: 'xMidYMid meet',
        width: size,
        height: size,
        viewBox: `0 0 ${iconInfo.width} ${iconInfo.height}`,
        ...props,
      })}
    </IconWrapper>
  )
}
