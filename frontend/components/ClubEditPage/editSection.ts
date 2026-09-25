import { CSSProperties } from 'react'

export const EDIT_SECTION_ATTR = 'data-edit-section'

export const editSectionCardStyle: CSSProperties = {
  marginBottom: 20,
  boxShadow: 'none',
  border: '1px solid #dbdbdb',
  borderRadius: 6,
  scrollMarginTop: '7.5rem',
}

export const editSectionHeaderStyle: CSSProperties = {
  boxShadow: 'none',
  borderBottom: '1px solid #dbdbdb',
}

export function toSectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
