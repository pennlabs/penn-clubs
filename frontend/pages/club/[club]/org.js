import renderPage from '../../../renderPage'
import { doApiRequest } from '../../../utils'
import React, { Component } from 'react'
import { Loading } from '../../../components/common'
import OrgChildren from '../../../components/OrgPage/OrgChildren'

class Org extends Component {
  constructor(props) {
    super(props)
    this.state = {
      club: null,
      children: null,
    }
  }

  componentDidMount() {
    doApiRequest(`/clubs/${this.props.query.club}/?format=json`)
      .then(resp => resp.json())
      .then(data => {
        this.setState({ club: data })
      })
    doApiRequest(`/clubs/${this.props.query.club}/children/?format=json`)
      .then(resp => {
        console.log(resp)
        return resp.json()
      })
      .then(data => {
        this.setState({ children: data.children })
      })
  }

  render() {
    const { club, children } = this.state
    if (!club || !children) {
      return <Loading />
    }
    return <OrgChildren children={children} />
  }
}

Org.getInitialProps = async props => {
  const { query } = props
  return { query: query }
}

export default renderPage(Org)
