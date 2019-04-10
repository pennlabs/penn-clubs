import React from 'react'
import Select from 'react-select'

class SearchBar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tags: [],
      sizes: [],
      names: [],
      sizeOptions: [
        { value: 1, label: 'less than 20 members' },
        { value: 2, label: '20 to 50 members' },
        { value: 3, label: '50 to 100 members' },
        { value: 4, label: 'more than 100'}
      ],
      tagOptions: props.tags.map((tag) => ({value: tag.id, label: tag.name})),
      nameOptions: props.clubs.map((club) => ({value: club.name, label: club.name})),
      clubs: props.clubs,
    }
  }

  filterClubs(names, sizes, tags) {
    var clubs1 = this.filterByName(names, this.state.clubs)
    var clubs2 = this.filterBySize(sizes, clubs1)
    var clubs3 = this.filterByTag(tags, clubs2)
    return clubs3
  }

  filterBySize(sizes, clubs) {
    return clubs.length ? sizes.length ? clubs.filter((club) => {
      var contains;
      sizes.forEach(size => {
        if (club.size == size.value) {
          contains = true;
        }
      })
      return contains;
    }) : clubs : []
  }

  filterByTag(tags, clubs) {
    return clubs.length ? tags.length ? clubs.filter((club) => {
      return tags.every(tag => club.tags.includes(tag.value))
    }) : clubs : []
  }

  filterByName(names, clubs) {
    return clubs.length ? names.length ? clubs.filter((club) => {
      var contains
      names.forEach(name => {
        if (club.name === name.value) {
          contains = true;
        }
      })
      return contains;
    }) : clubs : []
  }

  updateTags(tags) {
    this.setState({ tags })
    var { sizes, names } = this.state
    this.props.resetDisplay(this.filterClubs(names, sizes, tags))
  }

  updateNames(names) {
    this.setState({ names })
    var { sizes, tags } = this.state
    this.props.resetDisplay(this.filterClubs(names, sizes, tags))
  }

  updateSizes(sizes) {
    this.setState({ sizes })
    var { tags, names } = this.state
    this.props.resetDisplay(this.filterClubs(names, sizes, tags))
  }

  render() {
    const { sizes, tags, names, nameOptions, tagOptions, sizeOptions } = this.state
    return (
      <div
        className="hero is-flex"
        style={{
          position: "fixed",
          top: 50,
          minHeight: 80,
          width: "100%",
          backgroundColor: "white",
          boxShadow: "0px 2px 4px #e5e5e5",
          padding: 20}}>
        <div className="columns" style={{ display: "flex", alignItems: "center"}}>
          <div className="column is-4">
            <Select
              closeOnSelect={false}
              value={names}
              options={nameOptions}
              onChange={this.updateNames.bind(this)}
              isMulti
              isSearchable
              placeholder="Any Club"
              simpleValue
            />
            </div>
            <div className="column is-4">
              <Select
                closeOnSelect={false}
                value={tags}
                options={tagOptions}
                onChange={this.updateTags.bind(this)}
                isMulti
                placeholder="Any Type"
                simpleValue
              />
            </div>
            <div className="column is-4">
              <Select
                closeOnSelect={false}
                value={sizes}
                options={sizeOptions}
                onChange={this.updateSizes.bind(this)}
                isMulti
                placeholder="Any Size"
                simpleValue
              />
            </div>
          </div>
      </div>
    )
  }
}

export default SearchBar;
