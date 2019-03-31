import React from 'react'
import Select from 'react-select'

class SearchBar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      type: [],
      size: [],
      name: '',
      allClubs: [],
    }
  }

  mapTagProp(tags) {
    var mappedTags = tags.map((tag) => ({value: tag.id, label: tag.name}))
    return mappedTags;
  }

  componentWillMount() {
    this.setState({allClubs: this.props.clubs})
  }

  filterBySize(size) {

  }

  filterByTags(tags) {
    return tags.length ? this.state.allClubs.filter((club) => {
      var contains;
      tags.forEach(tag => {
        if(club.tags.includes(tag.value)) {
          contains = true;
        }
      })
      return contains;
    }) : this.state.allClubs
  }

  filterByName(name) {
    return this.state.allClubs.filter((club) => {
      return club.name.toLowerCase().indexOf(name.toLowerCase()) != -1
    })
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
      { value: 'small', label: 'less than 20 members' },
      { value: 'mid', label: '20 to 50 members' },
      { value: 'large', label: 'more than 50 members' }]
    const typeOptions = this.mapTagProp(tags);
    return (
      <div className="hero"
      style={{
        position: "fixed",
        top: 0,
        maxHeight: 400,
        minHeight: 150,
        width: "100%",
        backgroundColor: "white",
        boxShadow: "0px 2px 4px #d5d5d5",
        padding: 40 }}>
        <div className="columns is-vcentered" style={{ display: "flex", alignItems: "center" }}>
          <div className="column is-1">
            <img src="/static/img/pc.png" width="50px" style={{marginTop: 10}}/>
          </div>
          <div className="column is-4">
            <input
              className="input"
              placeholder="Start your club search."
              style={{
                width: '100%',
                padding: 12,
                fontSize: '1rem',
                fontWeight: '400',
                borderRadius: '5px',
                border: '1px solid #ccc',
                backgroundColor: "#fff",
                boxShadow: "none",
                borderRadius: 4,
              }}
              type="text"
              value={name}
              onChange={(e) => this.updateByName(e.target.value)}
              />
            </div>
            <div className="column is-4" style={{ padding: 10 }}>
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
            <div className="column is-3" style={{ padding:10 }}>
              <Select
                closeOnSelect={false}
                value={size}
                options={sizeOptions}
                onChange={size => this.setState({ size })}
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
