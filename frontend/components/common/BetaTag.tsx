import { BlueTag } from './Tags'

type BetaTagProps = {
  children: React.ReactNode
  /** The word on the tag. "Beta" warns; "New" advertises. */
  label?: string
  /**
   * The negative margin below lifts the tag against a page <Title>, which is
   * what every caller wanted until the navbar. Pass false to sit inline.
   */
  raised?: boolean
}

export const BetaTag = ({
  children,
  label = 'Beta',
  raised = true,
}: BetaTagProps) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {/* the crushed line-height squares the tag against a page <Title>; inline
          it just lifts the tag off the text's optical centre */}
      <div
        style={{ lineHeight: raised ? '1' : 'inherit', fontSize: 'inherit' }}
      >
        {children}
      </div>
      <BlueTag
        className="tag is-rounded has-text-white"
        // a tag's usual bottom margin, for spacing it in a list, would lift
        // it above the text it sits beside
        style={raised ? { marginTop: '-30px' } : { margin: 0 }}
      >
        {label}
      </BlueTag>
    </div>
  )
}
