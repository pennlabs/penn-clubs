import { BlueTag } from './Tags'

export const BetaTag = ({ children }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ lineHeight: '1', fontSize: 'inherit' }}>{children}</div>
      <BlueTag
        className="tag is-rounded has-text-white"
        style={{ marginTop: '-30px' }}
      >
        Beta
      </BlueTag>
    </div>
  )
}
