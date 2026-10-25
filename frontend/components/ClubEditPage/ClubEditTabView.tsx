import { useRouter } from 'next/router'
import { ReactElement, ReactNode, useEffect, useState } from 'react'

import { UserInfo } from '../../types'
import ClubAdminShell, {
  AdminNavItem,
  PageHeading,
  PageTitle,
} from './ClubAdminShell'

const PRIMARY_TAB_NAMES = [
  'home',
  'info',
  'member',
  'events',
  'recruitment',
  'resources',
  'questions',
  'settings',
  'analytics',
]

const EXTRA_TAB_NAMES = ['applications', 'notes', 'organization']

const SELF_TITLED = new Set(['home', 'info', 'member', 'events'])

const TAB_ICONS: Record<string, string> = {
  home: 'home',
  info: 'edit',
  notes: 'clipboard',
  member: 'user',
  events: 'calendar',
  recruitment: 'user-plus',
  applications: 'file',
  resources: 'folder',
  questions: 'help-circle',
  settings: 'settings',
  analytics: 'activity',
  organization: 'grid',
}

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
  clubName: string
  inactive?: boolean
  userInfo?: UserInfo
}

const ClubEditTabView = ({
  tabs,
  tab,
  route,
  clubName,
  inactive,
  userInfo,
}: Props): ReactElement<any> => {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState<string | null>(tab ?? null)

  useEffect(() => {
    if (tab) {
      setCurrentTab(tab)
    }
  }, [tab])

  useEffect(() => {
    const handleChange = (url: string) => {
      if (url.startsWith(route)) {
        const newTab = url.substring(route.length).match(/^\/?([^/?]*)\/?/)?.[1]
        if (newTab) {
          setCurrentTab(newTab)
        }
      }
    }

    router.events.on('routeChangeStart', handleChange)
    return () => router.events.off('routeChangeStart', handleChange)
  }, [route, router.events])

  const enabledTabs = tabs.filter((item) => !item.disabled)
  const activeName =
    currentTab && enabledTabs.some((item) => item.name === currentTab)
      ? currentTab
      : 'info'

  const setTab = (newTab: string) => {
    setCurrentTab(newTab)
    router.push(`${route}/${newTab}`, undefined, { shallow: true })
  }

  const toNav = (name: string): AdminNavItem | null => {
    const item = enabledTabs.find((tabItem) => tabItem.name === name)
    if (!item) {
      return null
    }
    return {
      name: item.name,
      label: item.label || item.name,
      icon: TAB_ICONS[item.name] || 'grid',
    }
  }

  const items = PRIMARY_TAB_NAMES.map(toNav).filter(
    (item): item is AdminNavItem => item != null,
  )
  const extraItems = EXTRA_TAB_NAMES.map(toNav).filter(
    (item): item is AdminNavItem => item != null,
  )
  const activeTab = enabledTabs.find((item) => item.name === activeName)
  const tabContent = activeTab?.content

  return (
    <ClubAdminShell
      clubName={clubName}
      inactive={inactive}
      userInfo={userInfo}
      items={items}
      extraItems={extraItems}
      active={activeName}
      onNavigate={setTab}
    >
      {!SELF_TITLED.has(activeName) && (
        <PageHeading>
          <PageTitle>{activeTab?.label || activeName}</PageTitle>
        </PageHeading>
      )}
      <div key={activeName}>
        {typeof tabContent === 'function' ? tabContent() : tabContent}
      </div>
    </ClubAdminShell>
  )
}

export default ClubEditTabView
