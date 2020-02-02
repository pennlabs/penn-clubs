import React, { useState, Component } from 'react'
import OrgChildren from './OrgChildren'
import {
  LIGHT_GRAY,
  BLACK,
  CLUBS_GREY_LIGHT,
  WHITE,
  BABY_BLUE,
} from '../../constants/colors'
import s from 'styled-components'
import { Icon } from '../common'
const Child = s.div`
  display: flex;
  flex-direction: row; 
  justify-content: space-between;
  margin: 5px;
  margin-left: 30px;
  margin-right: 0px; 
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
    const { child, noChildren } = this.props
    let icon = !this.state.show ? 'chevron-down' : 'chevron-up'
    if (noChildren) {
      return (
        <div
          style={{
            margin: '0px',
            marginLeft: '50px',
            borderRadius: '5px',
          }}
        >
          Club has no constituents
        </div>
      )
    }
    return (
      <div
        style={{
          margin: '0px',
          marginLeft: '50px',
          borderRadius: '5px',
          borderRadius: '10px',
        }}
      >
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
              }}
            >
              {child.name}
            </Text>
            <div>
              <TextLink
                href={`/club/${child.code}/admin`}
                onClick={this.handleDetails}
                target="_blank"
              >
                <Icon name="external-link" alt="View Club Page"></Icon>
              </TextLink>
              <Icon
                name={icon}
                alt="Display constituents"
                onClick={this.handleClick}
              ></Icon>
            </div>
          </Child>
          {this.state.show ? (
            // && child.children.length
            <OrgChildren children={this.props.child.children} />
          ) : null}
        </div>
      </div>
    )
  }
}
