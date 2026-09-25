import { ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { BORDER, HOVER_GRAY, WHITE } from '../../constants/colors'
import { MD, mediaMaxWidth, NAV_HEIGHT } from '../../constants/measurements'
import { EDIT_SECTION_ATTR } from './editSection'

const Rail = styled.nav`
  position: sticky;
  top: calc(${NAV_HEIGHT} + 4rem);
  width: 13.5rem;
  flex-shrink: 0;
  max-height: calc(100vh - ${NAV_HEIGHT} - 5rem);
  overflow: auto;
  padding-right: 0.5rem;

  ${mediaMaxWidth(MD)} {
    display: none;
  }
`

const Heading = styled.div`
  color: #57606a;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
`

const Item = styled.button<{ $active?: boolean }>`
  appearance: none;
  background: ${({ $active }) => ($active ? HOVER_GRAY : 'transparent')};
  border: 0;
  border-left: 2px solid ${({ $active }) => ($active ? '#24292f' : 'transparent')};
  color: ${({ $active }) => ($active ? '#24292f' : '#57606a')};
  cursor: pointer;
  display: block;
  font-size: 0.8125rem;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  padding: 0.4rem 0.65rem;
  text-align: left;
  width: 100%;

  &:hover {
    background: ${HOVER_GRAY};
    color: #24292f;
  }
`

const MobileWrap = styled.div`
  display: none;
  margin-bottom: 1rem;

  ${mediaMaxWidth(MD)} {
    display: block;
  }
`

const MobileSelect = styled.select`
  width: 100%;
  border: 1px solid ${BORDER};
  border-radius: 6px;
  padding: 0.5rem 0.65rem;
  background: ${WHITE};
`

type Section = {
  id: string
  label: string
}

const scanSections = (): Section[] => {
  return Array.from(
    document.querySelectorAll<HTMLElement>(`[${EDIT_SECTION_ATTR}]`),
  )
    .filter((el) => el.id)
    .map((el) => ({
      id: el.id,
      label: el.getAttribute(EDIT_SECTION_ATTR) || el.id,
    }))
}

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const ClubEditSectionNav = ({
  tabKey,
}: {
  tabKey?: string | null
}): ReactElement<any> | null => {
  const [sections, setSections] = useState<Section[]>([])
  const [active, setActive] = useState('')

  useEffect(() => {
    const update = () => setSections(scanSections())
    update()

    const root = document.getElementById('club-edit-content')
    if (!root) {
      return
    }

    const observer = new MutationObserver(update)
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [tabKey])

  useEffect(() => {
    if (!sections.length) {
      return
    }

    const onScroll = () => {
      const threshold = 140
      let current = sections[0].id
      sections.forEach((section) => {
        const el = document.getElementById(section.id)
        if (el && el.getBoundingClientRect().top <= threshold) {
          current = section.id
        }
      })
      setActive(current)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [sections])

  if (sections.length === 0) {
    return null
  }

  return (
    <>
      <Rail aria-label="Page sections">
        <Heading>On this page</Heading>
        {sections.map((section) => (
          <Item
            key={section.id}
            type="button"
            $active={section.id === active}
            onClick={() => scrollToSection(section.id)}
          >
            {section.label}
          </Item>
        ))}
      </Rail>
      <MobileWrap>
        <MobileSelect
          aria-label="Jump to section"
          value={active}
          onChange={(event) => {
            setActive(event.target.value)
            scrollToSection(event.target.value)
          }}
        >
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.label}
            </option>
          ))}
        </MobileSelect>
      </MobileWrap>
    </>
  )
}

export default ClubEditSectionNav
