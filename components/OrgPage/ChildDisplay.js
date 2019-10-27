import React, { useState, Component } from "react";
import OrgChildren from "./OrgChildren";
import { LIGHT_GRAY, HOVER_GRAY } from "../../constants/colors";
import s from "styled-components";

const Child = s.div`
  display: flex;
  flex-direction: row; 
  justify-content: space-between;
  margin: 5px 20px;
  border-radius: 25px;
  background: ${LIGHT_GRAY};
  padding: 15px; 

  &:hover{
    background: ${HOVER_GRAY}
  }
`;

export default class ChildDisplay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false
    };
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    this.setState(state => ({
      show: !state.show
    }));
  }
  render() {
    const { child } = this.props;
    return (
      <div style={{ margin: "10px", borderRadius: "20px" }}>
        <div
          style={{
            marginTop: 20,
            cursor: "pointer"
          }}
        >
          <Child>
            <p
              style={{
                fontSize: "15px",
                color: "white"
              }}
              onClick={this.handleClick}
            >
              {child.name}
            </p>
            <p style={{ color: "white" }}>Click for info</p>
          </Child>
          {this.state.show && child.children.length ? (
            <OrgChildren children={this.props.child.children} />
          ) : null}
        </div>
      </div>
    );
  }
}
