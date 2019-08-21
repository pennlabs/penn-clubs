import React from 'react'
import { titleize } from '../utils'

class TabView extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      currentTab: this.props.tabs[0].name
    }
  }

  componentDidMount() {
    this.setState({
      currentTab: window.location.hash.substring(1) || this.state.currentTab
    })
  }

  render() {
    const { tabs } = this.props

    return <div>
      <div className='tabs'>
        <ul>
          {tabs.filter((a) => !a.disabled).map((a) => <li className={a.name === this.state.currentTab ? 'is-active' : undefined} key={a.name}><a onClick={() => {
            this.setState({ currentTab: a.name })
            window.location.hash = '#' + a.name
          }}>{a.label || titleize(a.name)}</a></li>)}
        </ul>
      </div>
      {(tabs.filter((a) => a.name === this.state.currentTab)[0] || { content: <div>Invalid tab selected.</div> }).content}
    </div>
  }
}

export default TabView
