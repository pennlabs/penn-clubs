import React from "react";
// import TreeMenu from "react-simple-tree-menu";
import ChildDisplay from "./ChildDisplay";
import "../../constants/colors";
import s from "styled-components";

export default function OrgChildren(props) {
  const { children } = props;
  return (
    <div style={{ whiteSpace: "pre-wrap" }}>
      {console.log("CHILDREN", children)}
      {/* <h2>Club Children</h2> */}
      {children.map(c => {
        {
          console.log(c);
        }
        return <ChildDisplay child={c}></ChildDisplay>;
      })}
      {/* <TreeMenu data={children} /> */}
      {/* <TreeViewMenu data={children} /> */}
      {children.map(c => {
        <p>{c.name} uh</p>;
      })}
    </div>
  );
}
