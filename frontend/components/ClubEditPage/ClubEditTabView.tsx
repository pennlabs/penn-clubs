import { useRouter } from 'next/router'
import {
  ReactElement,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

import { HOVER_GRAY, WHITE } from '../../constants/colors'
import { MD, mediaMaxWidth, NAV_HEIGHT } from '../../constants/measurements'
import { Icon } from '../common'
import ClubEditSectionNav from './ClubEditSectionNav'

const PRIMARY_TAB_NAMES = [
  'info',
  'member',
  'events',
  'recruitment',
  'applications',
  'analytics',
  'settings',
]

const TAB_ICONS: Record<string, string> = {
  info: 'edit',
  notes: 'clipboard',
  member: 'user',
  events: 'calendar',
  recruitment: 'user-check',
  applications: 'file',
  resources: 'paperclip',
  questions: 'message-circle',
  settings: 'settings',
  analytics: 'activity',
  organization: 'grid',
}

const TabBar = styled.div`
  position: sticky;
  top: ${NAV_HEIGHT};
  z-index: 20;
  background: ${WHITE};
  border-bottom: 1px solid #dbdbdb;
  margin: 0 -0.25rem 1.25rem;
  padding: 0 0.25rem;
  overflow: visible;
`

const TabRow = styled.div`
  display: flex;
  align-items: stretch;
  min-height: 3rem;
  overflow: visible;
`

const TabButton = styled.button<{ $active?: boolean }>`
  appearance: none;
  background: transparent;
  border: 0;
  border-bottom: 2px solid
    ${({ $active }) => ($active ? '#24292f' : 'transparent')};
  color: ${({ $active }) => ($active ? '#24292f' : '#57606a')};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  padding: 0.75rem 0.85rem;
  margin-bottom: -1px;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: ${HOVER_GRAY};
    color: #24292f;
  }
`

const MoreWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`

const MoreMenu = styled.div<{ $top: number; $left: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  z-index: 1100;
  min-width: 14rem;
  background: ${WHITE};
  border: 1px solid #dbdbdb;
  border-radius: 6px;
  padding: 0.35rem 0;
`

const MoreItem = styled.button<{ $active?: boolean }>`
  appearance: none;
  background: ${({ $active }) => ($active ? HOVER_GRAY : 'transparent')};
  border: 0;
  color: #24292f;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  padding: 0.55rem 0.85rem;
  text-align: left;
  width: 100%;

  &:hover {
    background: ${HOVER_GRAY};
  }
`

const Workspace = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1.75rem;

  ${mediaMaxWidth(MD)} {
    flex-direction: column;
  }
`

const Content = styled.div`
  flex: 1;
  min-width: 0;
`

type EditTab = {
  name: string
  label?: string
  content: ReactNode | (() => ReactNode)
  disabled?: boolean
}

type Props = {
  tabs: EditTab[]
  tab?: string | null
  route: string
}

const ClubEditTabView = ({ tabs, tab, route }: Props): ReactElement<any> => {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState<string | null>(tab ?? null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const moreRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tab) {
      setCurrentTab(tab)
    }
  }, [tab])

  useEffect(() => {
    const handleChange = (url: string) => {
      if (url.startsWith(route)) {
        const newTab = url.substring(route.length).match(/^\/?([^/]*)\/?$/)?.[1]
        if (newTab) {
          setCurrentTab(newTab)
        }
      }
    }

    router.events.on('routeChangeStart', handleChange)
    return () => router.events.off('routeChangeStart', handleChange)
  }, [route, router.events])

  const updateMenuPos = () => {
    const button = moreRef.current
    if (!button) {
      return
    }
    const rect = button.getBoundingClientRect()
    const width = 224
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - width - 8,
    )
    setMenuPos({
      top: rect.bottom + 4,
      left,
    })
  }

  useLayoutEffect(() => {
    if (!moreOpen) {
      return
    }
    updateMenuPos()
    const onReposition = () => updateMenuPos()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [moreOpen])

  useEffect(() => {
    if (!moreOpen) {
      return
    }
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        moreRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setMoreOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [moreOpen])

  const enabledTabs = tabs.filter((item) => !item.disabled)
  const activeName =
    currentTab && enabledTabs.some((item) => item.name === currentTab)
      ? currentTab
      : enabledTabs[0]?.name

  const setTab = (newTab: string) => {
    setCurrentTab(newTab)
    setMoreOpen(false)
    router.push(`${route}/${newTab}`, undefined, { shallow: true })
  }

  const primaryTabs = PRIMARY_TAB_NAMES.map((name) =>
    enabledTabs.find((item) => item.name === name),
  ).filter((item): item is NonNullable<typeof item> => item != null)
  const moreTabs = enabledTabs.filter(
    (item) => !PRIMARY_TAB_NAMES.includes(item.name),
  )
  const activeTab = enabledTabs.find((item) => item.name === activeName)
  const tabContent = activeTab?.content
  const moreActive = moreTabs.some((item) => item.name === activeName)

  return (
    <>
      <TabBar>
        <TabRow>
          {primaryTabs.map(({ name, label }) => (
            <TabButton
              key={name}
              type="button"
              $active={name === activeName}
              onClick={() => setTab(name)}
            >
              <Icon name={TAB_ICONS[name] || 'grid'} alt="" size="0.95rem" />
              {label || name}
            </TabButton>
          ))}
          {moreTabs.length > 0 && (
            <MoreWrap ref={moreRef}>
              <TabButton
                type="button"
                $active={moreActive || moreOpen}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setMoreOpen((open) => !open)
                }}
              >
                More
                <Icon name="chevron-down" alt="" size="0.75rem" />
              </TabButton>
              {moreOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                  <MoreMenu
                    ref={menuRef}
                    role="menu"
                    $top={menuPos.top}
                    $left={menuPos.left}
                  >
                    {moreTabs.map(({ name, label }) => (
                      <MoreItem
                        key={name}
                        type="button"
                        $active={name === activeName}
                        onClick={() => setTab(name)}
                      >
                        <Icon
                          name={TAB_ICONS[name] || 'grid'}
                          alt=""
                          size="0.95rem"
                        />
                        {label || name}
                      </MoreItem>
                    ))}
                  </MoreMenu>,
                  document.body,
                )}
            </MoreWrap>
          )}
        </TabRow>
      </TabBar>
      <Workspace>
        <ClubEditSectionNav tabKey={activeName} />
        <Content id="club-edit-content">
          <div key={activeName}>
            {typeof tabContent === 'function' ? tabContent() : tabContent}
          </div>
        </Content>
      </Workspace>
    </>
  )
}

export default ClubEditTabView
