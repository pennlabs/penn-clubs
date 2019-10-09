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

  render() {
    const { tabs, tabStyle } = this.props

    return (
      <div>
        <div className={'tabs ' + tabStyle}>
          <ul>
            {tabs
              .filter(a => !a.disabled)
              .map(a => (
                <li
                  className={
                    a.name === this.state.currentTab ? 'is-active' : undefined
                  }
                  key={a.name}
                >
                  <a
                    onClick={() => {
                      this.setState({ currentTab: a.name })
                      window.location.hash = '#' + a.name
                    }}
                  >
                    {a.label || titleize(a.name)}
                  </a>
                </li>
              ))}
          </ul>
        </div>
        {
          (
            tabs.filter(a => a.name === this.state.currentTab)[0] || {
              content: <div>Invalid tab selected.</div>,
            }
          ).content
        }
      </div>
      {getTabContent()}
    </>
  )
}

export default TabView
