import { ReactNode, useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'

import { ADMIN_ACCENT, ADMIN_NAVY } from './adminTheme'

export const AdminPrimary = styled.button`
  appearance: none;
  align-items: center;
  background: ${ADMIN_ACCENT};
  border: 0;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  font-weight: 600;
  gap: 6px;
  justify-content: center;
  line-height: 1;
  padding: 9px 14px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  &:hover:not(:disabled) {
    background: #3b45d4;
    color: #fff;
  }
`

export const AdminGhost = styled.button`
  appearance: none;
  align-items: center;
  background: #fff;
  border: 1px solid #e4e4e4;
  border-radius: 999px;
  color: ${ADMIN_NAVY};
  cursor: pointer;
  display: inline-flex;
  font-size: 13px;
  font-weight: 500;
  gap: 6px;
  justify-content: center;
  line-height: 1;
  padding: 8px 12px;

  &:hover:not(:disabled) {
    background: #f7f8fb;
    color: ${ADMIN_NAVY};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`

export const AdminGhostLink = styled.a`
  appearance: none;
  align-items: center;
  background: #fff;
  border: 1px solid #e4e4e4;
  border-radius: 999px;
  color: ${ADMIN_NAVY};
  cursor: pointer;
  display: inline-flex;
  font-size: 13px;
  font-weight: 500;
  gap: 6px;
  justify-content: center;
  line-height: 1;
  padding: 8px 12px;
  text-decoration: none;

  &:hover {
    background: #f7f8fb;
    color: ${ADMIN_NAVY};
    text-decoration: none;
  }
`

export const AdminDanger = styled(AdminGhost)`
  border-color: #f0b4b4;
  color: #a32020;

  &:hover:not(:disabled) {
    background: #fde8e8;
    color: #a32020;
  }
`

export const AdminActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 1.25rem;
`

const Track = styled.div<{ $height?: number }>`
  position: relative;
  display: inline-flex;
  align-items: stretch;
  background: white;
  border-radius: 999px;
  box-sizing: border-box;
  height: ${({ $height }) => ($height ? `${$height}px` : 'auto')};
  padding: 3px;
`

const Thumb = styled.span`
  position: absolute;
  top: 3px;
  left: 0;
  height: calc(100% - 6px);
  background: #e7f6ee;
  border-radius: 999px;
  pointer-events: none;
  transform: translateX(var(--thumb-x, 0px));
  width: var(--thumb-w, 0px);

  @media (prefers-reduced-motion: reduce) {
    transition: none !important;
  }
`

const PillButton = styled.button<{ $active?: boolean; $muted?: boolean }>`
  align-items: center;
  appearance: none;
  background: transparent;
  border: 0;
  border-radius: 999px;
  color: ${({ $active, $muted }) =>
    $active ? '#178a4a' : $muted ? '#6b7280' : ADMIN_NAVY};
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  gap: 6px;
  line-height: 1;
  padding: 6px 14px;
  position: relative;
  transition: color 0.2s ease;
  z-index: 1;

  svg {
    display: block;
  }
`

type SlidingPillsOption<T extends string> = {
  value: T
  label: ReactNode
}

export function SlidingPills<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  height,
  muted,
}: {
  value: T
  options: SlidingPillsOption<T>[]
  onChange: (value: T) => void
  ariaLabel?: string
  height?: number
  muted?: boolean
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLSpanElement>(null)
  const didMount = useRef(false)

  useLayoutEffect(() => {
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!track || !thumb) {
      return
    }

    const place = (withMotion: boolean) => {
      const active = track.querySelector<HTMLElement>('[aria-pressed="true"]')
      if (!active) {
        return
      }
      const motion =
        withMotion &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      thumb.style.transition = motion
        ? 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), width 0.32s cubic-bezier(0.22, 1, 0.36, 1)'
        : 'none'
      const trackBox = track.getBoundingClientRect()
      const buttonBox = active.getBoundingClientRect()
      track.style.setProperty('--thumb-x', `${buttonBox.left - trackBox.left}px`)
      track.style.setProperty('--thumb-w', `${buttonBox.width}px`)
    }

    place(didMount.current)
    didMount.current = true
    const observer = new ResizeObserver(() => place(false))
    observer.observe(track)
    return () => observer.disconnect()
  }, [value, options.length])

  return (
    <Track ref={trackRef} $height={height} role="group" aria-label={ariaLabel}>
      <Thumb ref={thumbRef} aria-hidden="true" />
      {options.map((option) => (
        <PillButton
          key={option.value}
          type="button"
          $active={value === option.value}
          $muted={muted}
          data-active={value === option.value ? 'true' : undefined}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </PillButton>
      ))}
    </Track>
  )
}
