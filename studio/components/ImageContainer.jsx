import styled from "@emotion/styled";

const ImageContainer = styled.div`
  position: relative;
  z-index: 10;
  display: flex;
  justifycontent: center;
  margin: 48px 48px 120px 48px;
  padding: 24px;

  & > div {
    align-items: center;
    width: calc(100vw - 138px);
    height: 100%;
    border: 1px #000 solid;
    background: #fff;
    margin: 0 auto;
  }

  img {
    width: calc(100vw - 140px);
  }

  &:after {
    display: block;
    position: absolute;
    top: 40px;
    left: 40px;
    content: "";
    width: calc(100vw - 140px);
    height: calc(100% - 50px);
    border: 1px #ff485e solid;
    z-index: -2;
  }

  &:before {
    position: absolute;
    content: "Editor Preview";
    top: -8px;
    left: 0;
    width: 100%;
    text-align: center;
  }

  @media screen and (min-width: 1296px) {
    & > div {
      width: 1202px;
      position: relative;
    }

    img {
      width: 1200px;
    }

    &:after {
      content: "";
      width: 1200px;
      height: 600px;
      left: calc((100vw - 1200px) / 2 - 32px);
    }
  }
`;

export default ImageContainer;
