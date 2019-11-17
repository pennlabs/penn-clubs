import React, { useState, Component } from 'react'
import OrgChildren from './OrgChildren'
import { Link } from '../../routes'
import {
  LIGHT_GRAY,
  BLACK,
  CLUBS_GREY_LIGHT,
  WHITE,
  BABY_BLUE,
} from '../../constants/colors'
import s from 'styled-components'
import Icon from '../common/Icon'
const Child = s.div`
  display: flex;
  flex-direction: row; 
  justify-content: space-between;
  margin: 5px;
  margin-left: 30px;
  border-radius: 10px;
  background: ${WHITE};
  padding: 20px; 
  border: 1px ${BLACK} solid

  &:hover{
    background: ${LIGHT_GRAY}
    color: ${BLACK}
  }
`
const Text = s.p`
  color: ${BLACK};
  font-size: 16px;

  &:hover{
  }
`
const TextLink = s.a`
  color: ${BLACK};
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
  handleDetails() {}
  render() {
    const { child } = this.props
    return (
      <div
        style={{
          margin: '10px',
          borderRadius: '5px',
          // border: `2px black solid`,
          borderRadius: '10px',
        }}
      >
        <div
          style={{
            marginTop: 20,
            cursor: 'pointer',
          }}
        >
          <Child onClick={this.handleClick}>
            <Text
              style={{
                fontSize: '15px',
              }}
            >
              {child.name}
            </Text>
            <TextLink href={`/club/${child.code}/admin`} onClick={this.handleDetails}>
              View{` `}
              <Icon name="external-link" alt="View Club Page"></Icon>
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
