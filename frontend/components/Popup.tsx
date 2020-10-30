import { ReactElement, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CSSProperties } from 'styled-components'

export enum PopupPosition {
  TOP = 0,
  BOTTOM = 1,
  LEFT = 2,
  RIGHT = 3,
}

export enum PopupAlignment {
  START = 0,
  CENTER = 1,
  END = 2,
}

interface Props {
  anchorElement: HTMLElement
  preferredPosition?: PopupPosition
  align?: PopupAlignment
  children: ReactElement
  parent?: HTMLElement
  show: boolean
  style?: CSSProperties
}

const Popup = (props: Props): ReactElement => {
  const {
    anchorElement,
    preferredPosition = PopupPosition.TOP,
    align = PopupAlignment.CENTER,
    children,
    parent = document.querySelector('body'),
    style = {},
  } = props

  const [show, setShow] = useState<boolean>(props.show)

  useEffect(() => {
    setShow(props.show)
  }, [props.show])

  const coordinates: CSSProperties = (() => {
    const c: CSSProperties = {}
    const {
      top,
      bottom,
      left,
      right,
      width,
      height,
    } = anchorElement.getBoundingClientRect()
    if (preferredPosition === PopupPosition.TOP) c.bottom = top
    if (preferredPosition === PopupPosition.BOTTOM) c.top = bottom
    if (preferredPosition === PopupPosition.LEFT) c.right = left
    if (preferredPosition === PopupPosition.RIGHT) c.left = right
    if (align === PopupAlignment.START) {
      // TOP / BOTTOM <= 1
      if (preferredPosition <= 1) c.left = left
      else c.top = top
    }
    if (align === PopupAlignment.CENTER) {
      // TOP / BOTTOM <= 1
      if (preferredPosition <= 1) {
        c.left = left + width / 2
        c.transform = `translate(-50%, 0)`
      } else {
        c.top = top + height / 2
        c.transform = `translate(50%, -50%)`
      }
    }
    if (align === PopupAlignment.END) {
      // TOP / BOTTOM <= 1
      if (preferredPosition <= 1) c.right = right
      else c.bottom = bottom
    }
    return c
  })()

  return createPortal(
    parent,
    <div
      style={{
        ...coordinates,
        ...style,
        position: 'absolute',
        display: show ? 'block' : 'none',
      }}
    >
      {children}
    </div>,
  )
}

export default Popup
