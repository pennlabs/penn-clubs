import React from "react";
import s from "styled-components";
import {
  HOVER_GRAY,
  FOCUS_GRAY,
  LIGHTER_RED,
  LIGHT_RED,
  RED,
  DARK_GRAY
} from "../../constants/colors";
import { mediaMaxWidth, SM } from "../../constants/measurements";

const EditButton = s.button`
  padding: 10px 10px 0 0;
  cursor: pointer;
  line-height: 0;
  padding: 10px;
  float: right;
  border-width: 0;
  background-color: ${HOVER_GRAY};
  font-weight: 600;
  color: ${DARK_GRAY} !important;
  margin-bottom: 1rem;

  &:hover {
    background-color: ${FOCUS_GRAY};
  }

  ${mediaMaxWidth(SM)} {
    margin-bottom: 0.5rem;
  }
`;

export default function EditButton() {
  return (
    <div>
      <p>Edit Button5</p>
    </div>
  );
}
