import React from 'react'
import DropdownFilter from './DropdownFilter'
import posed from 'react-pose'
import { CLUBS_GREY, CLUBS_GREY_LIGHT } from '../colors'

const Pop = posed.div({
  idle: { scale: 1 },
  hovered: { scale: 1.1 }
})

class SearchBar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      nameInput: '',
      sizeOptions: [
        { value: 1, label: 'less than 20 members' },
        { value: 2, label: '20 to 50 members' },
        { value: 3, label: '50 to 100 members' },
        { value: 4, label: 'more than 100' }
      ],
      tagOptions: props.tags.map((tag) => ({ value: tag.id, label: tag.name, count: tag.clubs })),
      applicationOptions: [
        { value: 1, label: 'Requires application' },
        { value: 2, label: 'Does not require application' },
        { value: 3, label: 'Currently accepting applications' }],
      hoverList: false,
      hoverCard: false,
      hoverDown: false,
      selectedTags: props.selectedTags
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.nameInput !== this.state.nameInput) {
      this.props.resetDisplay(this.state.nameInput, this.state.selectedTags)
    }
  }

  render() {
    const { tagOptions, sizeOptions, applicationOptions, selectedTags } = this.state
    const { switchDisplay, resetDisplay, updateTag } = this.props
    return (
      <div style={{ height: '100vh', width: '100%', overflow: 'hidden', position: 'sticky', top: -20 }}>
        <div
          style={{
            position: 'absolute',
            height: '90vh',
            width: '100%',
            right: -17,
            padding: '50px 0',
            overflowY: 'scroll',
            overflowX: 'hidden',
            marginBottom: '8rem'
          }}>
          <div className="is-flex" style={{ justifyContent: 'space-between', padding: '0 3px' }}>
            <b style={{ color: CLUBS_GREY }}>View: </b>
            <div className="is-flex">
              <Pop
                pose={this.state.hoverCard ? 'hovered' : 'idle'}
                onMouseEnter={() => this.setState({ hoverCard: true })}
                onMouseLeave={() => this.setState({ hoverCard: false })}>
                <span className="icon" style={{ cursor: 'pointer', color: CLUBS_GREY }} onClick={(e) => switchDisplay('cards')}>
                  <i className="fas fa-th-large" title="Grid View"></i>
                </span>
              </Pop>
              <Pop
                pose={this.state.hoverList ? 'hovered' : 'idle'}
                onMouseEnter={() => this.setState({ hoverList: true })}
                onMouseLeave={() => this.setState({ hoverList: false })}>
                <span className="icon" >
                  <i className="fas fa-list" title="List View" style={{ cursor: 'pointer', color: CLUBS_GREY }} onClick={(e) => switchDisplay('list')}></i>
                </span>
              </Pop>
            </div>
          </div>
          <div style={{ margin: '30px 0' }}>
            <hr style={{ backgroundColor: CLUBS_GREY, height: '2px', margin: 0, padding: 0 }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 3px' }}>
              <input
                type="text"
                name="search"
                placeholder="Search"
                aria-label="Search"
                style={{
                  borderWidth: 0,
                  outline: 'none',
                  color: CLUBS_GREY,
                  width: '100%',
                  fontSize: '1em'
                }}
                value={this.state.nameInput}
                onChange={(e) => this.setState({ nameInput: e.target.value })}
              />
              <span className="icon" style={{ cursor: 'pointer', color: CLUBS_GREY }}>
                {this.state.nameInput ? <i onClick={(e) => this.setState({ nameInput: '' })} className="fas fa-times"></i> : <i className="fas fa-search"></i>}
              </span>
            </div>
          </div>
          <DropdownFilter
            name="Type"
            options={tagOptions}
            selected={selectedTags.filter(tag => tag.name === 'Type')}
            updateTag={updateTag}
          />
          <DropdownFilter
            name="Size"
            options={sizeOptions}
            selected={selectedTags.filter(tag => tag.name === 'Size')}
            updateTag={updateTag}
          />
          <DropdownFilter
            name="Application"
            options={applicationOptions}
            selected={selectedTags.filter(tag => tag.name === 'Application')}
            updateTag={updateTag}
          />
        </div>
      </div>
    )
  }
}

export default SearchBar
