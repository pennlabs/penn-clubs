import React from 'react'
import Select from 'react-select'

class SearchBar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      type: [],
      size: [],
      name: [],
      allClubs: [],
    }
  }

  mapTagProp(tags) {
    var mappedTags = tags.map((tag) => ({value: tag.id, label: tag.name}))
    return mappedTags;
  }

  mapNameProp(clubs) {
    var mappedTags = clubs.map((club) => ({value: club.name, label: club.name}))
    return mappedTags;
  }

  componentWillMount() {
    this.setState({allClubs: this.props.clubs})
  }

  filterBySize(sizes) {
    return sizes.length ? this.state.allClubs.filter((club) => {
      var contains;
      sizes.forEach(size => {
        if (club.size == size.value) {
          contains = true;
        }
      })
      return contains;
    }) : this.state.allClubs
  }

  filterByTags(tags) {
    return tags.length ? this.state.allClubs.filter((club) => {
      return tags.every(tag => club.tags.includes(tag.value))
    }) : this.state.allClubs
  }

  filterByName(names) {
    return names.length ? this.state.allClubs.filter((club) => {
      var contains
      names.forEach(name => {
        if (club.name === name.value) {
          contains = true;
        }
      })
      return contains;
    }) : this.state.allClubs
  }

  updateByType(type) {
    this.setState({ type })
    this.props.resetClubs(this.filterByTags(type))
  }

  updateByName(name) {
    this.setState({ name })
    this.props.resetClubs(this.filterByName(name))
  }

  updateBySize(size) {
    this.setState({ size })
    this.props.resetClubs(this.filterBySize(size))
  }

  render() {
    const {
      clubs,
      tags
    } = this.props
    const {
      size,
      type,
      name
    } = this.state
    const sizeOptions = [
      { value: 1, label: '< 20' },
      { value: 2, label: '20 - 50' },
      { value: 3, label: '50 - 100' },
      { value: 4, label: '> 100'}]
    const typeOptions = this.mapTagProp(tags)
    const nameOptions = this.mapNameProp(clubs)
    return (
      <div className="hero"
      style={{
        position: "fixed",
        top: 50,
        height: 100,
        width: "100%",
        backgroundColor: "white",
        boxShadow: "0px 2px 4px #d5d5d5",
        padding: "30px 30px 0px 30px"}}>
        <div className="columns" style={{ display: "flex", alignItems: "center"}}>
          <div className="column is-4">
            <Select
              closeOnSelect={false}
              value={name}
              options={nameOptions}
              onChange={this.updateByName.bind(this)}
              isMulti
              isSearchable
              placeholder="Any Club"
              simpleValue
            />
            </div>
            <div className="column is-4">
              <Select
                closeOnSelect={false}
                value={type}
                options={typeOptions}
                onChange={this.updateByType.bind(this)}
                isMulti
                placeholder="Any Type"
                simpleValue
              />
            </div>
            <div className="column is-4">
              <Select
                closeOnSelect={false}
                value={size}
                options={sizeOptions}
                onChange={this.updateBySize.bind(this)}
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
