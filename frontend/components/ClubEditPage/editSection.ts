import { CSSProperties } from 'react'

export const EDIT_SECTION_ATTR = 'data-edit-section'

export const editSectionCardStyle: CSSProperties = {
  marginBottom: 32,
  boxShadow: 'none',
  border: 'none',
  borderRadius: 6,
  scrollMarginTop: '7.5rem',
}

export const editSectionHeaderStyle: CSSProperties = {
  boxShadow: 'none',
  borderBottom: 'none',
}

export function toSectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
