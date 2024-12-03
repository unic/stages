import styled from "@emotion/styled";

const SloganContainer = styled.div`
  .visually-hidden {
    border: 0;
    padding: 0;
    margin: 0;
    position: absolute !important;
    height: 1px;
    width: 1px;
    overflow: hidden;
    clip: rect(
      1px 1px 1px 1px
    ); /* IE6, IE7 - a 0 height clip, off to the bottom right of the visible 1px box */
    clip: rect(
      1px,
      1px,
      1px,
      1px
    ); /*maybe deprecated but we need to support legacy browsers */
    clip-path: inset(
      50%
    ); /*modern browsers, clip-path works inwards from each corner*/
    white-space: nowrap; /* added line to stop words getting smushed together (as they go onto seperate lines and some screen readers do not understand line feeds as a space */
  }
  h2 {
    margin: 0 0 0 6px;
    font-weight: 300;
    font-size: 28px;
    font-style: italic;
  }
  p {
    margin: 4px 0 0 0;
    font-weight: 300;
    font-size: 20px;
    font-style: italic;
    color: #ff485e;
  }

  @media screen and (max-width: 767px) {
    text-align: center;
    h2 {
      font-size: 22px;
    }
    p {
      font-size: 14px;
    }
  }
`;

const PageSlogan = () => {
  return (
    <SloganContainer>
      <h1 className="visually-hidden">Stages Studio</h1>
      <h2>Form Management System (FMS)</h2>
      <p>coming soon...ish</p>
    </SloganContainer>
  );
};

export default PageSlogan;
