import { ReactElement } from 'react'
import s, { CSSProperties } from 'styled-components'

const reqSvgs = require.context('../../public/static/img/icons', true, /\.svg$/)

type IconWrapperProps = {
  noAlign?: boolean
}

const IconWrapper = s.span<IconWrapperProps>`
  display: inline-block;
  vertical-align: ${(props) => (props.noAlign ? 'baseline' : 'middle')};

  .button & {
    margin-right: 0.25rem;
  }

  & svg {
    display: block;
    margin: auto;
  }
`

type Props = {
  name: string
  alt?: string
  size?: string
  style?: CSSProperties
  show?: boolean
  onClick?: () => void
}

export const Icon = ({
  name,
  show = true,
  size = '1rem',
  ...props
}: Props): ReactElement | null => {
  const svg = reqSvgs(`./${name}.svg`)
  if (!show || !svg || !svg.default) {
    return null
  }
  const iconInfo = svg.default().props
  return (
    <IconWrapper>
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
