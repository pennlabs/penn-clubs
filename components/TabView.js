import { useState } from 'react'
import { titleize } from '../utils'

const TabView = ({ tabs }) => {
  const hashString = window.location.hash.substring(1)
  const [currentTab, setCurrentTab] = useState(hashString || tabs[0].name)

  const getTabContent = () =>
    (
      tabs.filter(a => a.name === currentTab)[0] || {
        content: <div>Invalid tab selected.</div>,
      }
    ).content

  const enabledTabs = tabs.filter(tab => !tab.disabled)

  return (
    <>
      <div className="tabs">
        <ul style={{ borderBottomWidth: '2px' }}>
          {enabledTabs.map(({ name, label }) => (
            <li
              className={name === currentTab ? 'is-active' : ''}
              key={`tab-${name}`}
            >
              <a
                style={{ borderBottomWidth: '2px', marginBottom: '-2px' }}
                onClick={() => {
                  setCurrentTab(name)
                  window.location.hash = `#${name}`
                }}
              >
                {label || titleize(name)}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {getTabContent()}
    </>
  )
}

export default TabView
