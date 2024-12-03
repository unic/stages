import styled from "@emotion/styled";

import { getWidth } from "./helpers";

const Container = styled.div`
  position: relative;
  flex-wrap: wrap;
  border: ${(props) =>
    props.isInEditMode && props.isEditMode && !props.isFieldConfigEditor
      ? "1px dashed #0A94F8"
      : !props.isFieldConfigEditor && props.isEditMode
      ? "1px dashed #ddd"
      : "1px solid rgba(0,0,0,0)"};
  border-radius: 5px;
  padding: 2px;
  row-gap: ${(props) => (props.isFieldConfigEditor ? "4px" : "16px")};
  background: ${(props) =>
    props.isEditMode && !props.isFieldConfigEditor ? "#fff" : "transparent"};
  box-shadow: ${(props) =>
    props.isEditMode && !props.isFieldConfigEditor
      ? "1px 1px 1px 0px rgba(0,0,0,0.05)"
      : "none"};
  min-width: ${(props) =>
    !props.isFieldConfigEditor
      ? getWidth(
          props.inGroup,
          props.isFieldConfigEditor,
          props.store.isEditMode,
          props.width
        )
      : "auto"};
  max-width: ${(props) =>
    getWidth(
      props.inGroup,
      props.isFieldConfigEditor,
      props.store.isEditMode,
      props.width
    )};
  transform: ${(props) =>
    props.transform
      ? `translate3d(${props.transform.x}px, ${props.transform.y}px, 0)`
      : undefined};
  z-index: ${(props) => (props.transform ? 1000 : 1)};
  margin-bottom: ${(props) => (props.isFieldConfigEditor ? "16px" : 0)};
  flex-direction: ${(props) => (props.colums ? "column" : "row")};
`;

export default Container;
