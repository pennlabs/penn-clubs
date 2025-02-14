import { CSSProperties, ReactElement } from 'react'
import styled from 'styled-components'

const Image = styled.img<{ size?: string }>`
  ${({ size }) => `width: ${size || '25%'};`}
  display: block;
  margin: 7.5%;
  margin-left: auto;
  margin-right: auto;
`

type EmptyStateProps = {
  name: string
  alt?: string
  size?: string
  style?: CSSProperties
}

export const EmptyState = ({
  name,
  alt,
  size,
  style,
  ...props
}: EmptyStateProps): ReactElement<any> => (
  <Image
    src={`/static/img/${name}.svg`}
    alt={alt}
    style={style}
    size={size}
    {...props}
  />
)
