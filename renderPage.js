import React from 'react'


function renderPage(Page) {
  class RenderPage extends React.Component {
    constructor(props) {
      super(props)
      this.state = {
        favorites: [],
      }
    }

    componentDidMount() {
      var favorites = JSON.parse(localStorage.getItem('favorites')) || []
      this.setState({ favorites })
    }

    updateFavorites(id) {
      var newFavs = this.state.favorites
      var i = newFavs.indexOf(id)
      if (i == -1) {
        newFavs.push(id)
      } else {
        newFavs.splice(i, 1)
      }
      localStorage.setItem('favorites', JSON.stringify(newFavs))
      this.setState({favorites: newFavs})
    }

    isFavorite(id) {
      return this.state.favorites.includes(id)
    }

    render() {
      var { clubs, tags } = this.props
      var { favorites } = this.state
      return(
        <div style={{backgroundColor: "#f9f9f9"}}>
          <Page
            clubs={clubs}
            tags={tags}
            favorites={favorites}
            updateFavorites={this.updateFavorites.bind(this)}
            isFavorite={this.isFavorite.bind(this)}
          />
        </div>
      )
    }
  }

  RenderPage.getInitialProps = async () => {
    const clubRequest = await fetch('https://clubs.pennlabs.org/clubs/?format=json')
    const clubResponse = await clubRequest.json()
    const tagsRequest = await fetch('https://clubs.pennlabs.org/tags/?format=json')
    const tagsResponse = await tagsRequest.json()
    return { clubs: clubResponse, tags: tagsResponse }
  }

  return RenderPage

}

export default renderPage
