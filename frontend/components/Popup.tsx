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

<<<<<<< HEAD
const Popup = (props: Props): ReactElement | null => {
=======
const Popup = (props: Props): ReactElement => {
>>>>>>> Popup component for Events
  const {
    anchorElement,
    preferredPosition = PopupPosition.TOP,
    align = PopupAlignment.CENTER,
    children,
    parent = document.querySelector('body'),
    style = {},
  } = props

  const [show, setShow] = useState(props.show)

  useEffect(() => {
    setShow(props.show)
    console.log(props.show)
  }, [props.show])

  if (!parent || !show) return null

  const coordinates: CSSProperties = (() => {
    const c: CSSProperties = {}
    let {
      top,
      bottom,
      left,
      right,
      width,
      height,
    } = anchorElement.getBoundingClientRect()

    top += window.scrollY
    bottom += window.scrollY
    left += window.scrollX
    right += window.scrollX

    if (preferredPosition === PopupPosition.TOP)
      c.bottom = window.innerHeight - bottom
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
    <div
      style={{
        ...coordinates,
        ...style,
        position: 'absolute',
        zIndex: 1000,
      }}
    >
      {children}
    </div>,
    parent,
  )
}

export default Popup
