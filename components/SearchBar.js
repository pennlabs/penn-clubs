import React from 'react'
import s from 'styled-components'
import DropdownFilter from './DropdownFilter'
import { BORDER_RADIUS } from '../constants/measurements'
import {
  MEDIUM_GRAY, HOVER_GRAY, FOCUS_GRAY, CLUBS_GREY
} from '../constants/colors'

const Wrapper = s.div`
  height: 100vh;
  width: 100%;
  overflow: hidden;
  position: sticky;
  top: -20px;
`

const Content = s.div`
  position: absolute;
  height: 90vh;
  width: calc(100% - 17px);
  padding: 42px 0 0 0;
  overflow-y: scroll;
  overflow-x: hidden;
  margin-bottom: 8rem;
  margin-left: 17px;

  &::-webkit-scrollbar {
    display: none;
  }
`

const Input = s.input`
  border-width: 0;
  outline: none;
  color: ${CLUBS_GREY};
  width: 100%;
  font-size: 1em;
  padding: 8px 10px;
  background: ${HOVER_GRAY};
  border-radius: ${BORDER_RADIUS};

  &:hover,
  &:active,
  &:focus {
    background: ${FOCUS_GRAY};
  }
`

const SearchIcon = s.span`
  cursor: pointer;
  color: ${MEDIUM_GRAY};
  opacity: 0.5;
  right: 6px;
  padding-top: 8px;
  position: absolute;
`

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
      selectedTags: props.selectedTags
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.nameInput !== this.state.nameInput) {
      clearTimeout(this.timeout)
      this.timeout = setTimeout(() => this.props.resetDisplay(this.state.nameInput, this.state.selectedTags), 200)
    }
  }

  render() {
    const { tagOptions, sizeOptions, applicationOptions, selectedTags } = this.state
    const { updateTag } = this.props
    return (
      <Wrapper>
        <Content>
          <div style={{ marginBottom: '30px' }}>
            <SearchIcon className="icon">
              {this.state.nameInput ? <i onClick={(e) => this.setState({ nameInput: '' })} className="fas fa-times"></i> : <i className="fas fa-search"></i>}
            </SearchIcon>
            <Input
              type="text"
              name="search"
              placeholder="Search"
              aria-label="Search"
              value={this.state.nameInput}
              onChange={(e) => this.setState({ nameInput: e.target.value })}
            />
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
        </Content>
      </Wrapper>
    )
  }
}

export default SearchBar
