import React, { useState, Component } from 'react'
import OrgChildren from './OrgChildren'
import { Link } from '../../routes'
import Icon from '../common/Icon'
import {
  LIGHT_GRAY,
  BLACK,
  CLUBS_GREY_LIGHT,
  WHITE,
  BABY_BLUE,
} from '../../constants/colors'
import s from 'styled-components'

const Child = s.div`
  display: flex;
  flex-direction: row; 
  justify-content: space-between;
  margin: 5px 20px;
  margin-left: 30px;
  border-radius: 20px;
  background: ${CLUBS_GREY_LIGHT};
  padding: 20px; 

  &:hover{
    background: ${LIGHT_GRAY}
    color: ${BLACK}
  }
`
const Text = s.p`
  color: ${WHITE};
  font-size: 16px;

  &:hover{
    font-weight: bold;
    color: ${BABY_BLUE}
  }
`
const TextLink = s.a`
  color: ${WHITE};
  font-size: 16px;

  &:hover{
    font-weight: bold;
    
  }
`

export default class ChildDisplay extends Component {
  constructor(props) {
    super(props)
    this.state = {
      show: false,
    }
    this.handleClick = this.handleClick.bind(this)
    this.handleDetails = this.handleDetails.bind(this)
  }
  handleClick() {
    this.setState(state => ({
      show: !state.show,
    }))
  }
  handleDetails() {
    console.log(this.state.child)
  }
  render() {
    const { child } = this.props
    return (
      <div style={{ margin: '10px', borderRadius: '20px' }}>
        <div
          style={{
            marginTop: 20,
            cursor: 'pointer',
          }}
        >
          <Child>
            <Text
              style={{
                fontSize: '15px',
                color: 'white',
              }}
              onClick={this.handleClick}
            >
              {child.name}
            </Text>
            {/* <Link>Click for info</Link> */}
            <TextLink
              href={`/club/${child.code}/admin`}
              style={{ color: 'white' }}
              onClick={this.handleDetails}
            >
              View{` `}
              <Icon name="external-link-white" alt="View Club Page"></Icon>
            </TextLink>
          </Child>
          {this.state.show && child.children.length ? (
            <OrgChildren children={this.props.child.children} />
          ) : null}
        </div>
      </div>
    )
  }
}
