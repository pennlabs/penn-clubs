import { ReactElement } from 'react'

import {
  EDIT_SECTION_ATTR,
  editSectionCardStyle,
  editSectionHeaderStyle,
  toSectionId,
} from './editSection'

type BaseCardProps = React.PropsWithChildren<{
  title: string
  sectionId?: string
}>

/**
 * All cards on the club edit page are wrapped in this base card.
 */
export default function BaseCard({
  children,
  title,
  sectionId,
}: BaseCardProps): ReactElement<any> {
  const id = sectionId || toSectionId(title)
  return (
    <div
      className="card"
      id={id}
      {...{ [EDIT_SECTION_ATTR]: title }}
      style={editSectionCardStyle}
    >
      <div className="card-header" style={editSectionHeaderStyle}>
        <p className="card-header-title">{title}</p>
      </div>
      <div className="card-content">{children}</div>
    </div>
  )
}
