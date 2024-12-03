import styled from "@emotion/styled";

const InfoCardContainer = styled.div`
  position: relative;
  margin: 48px auto 96px auto;
  padding: 48px;
  max-width: 960px;
  min-height: 420px;
  border-top: 1px #000 solid;
  border: 2px #000 solid;
  z-index: -2;

  h2 {
    font-weight: 700;
    font-size: 28px;
    font-style: italic;
    margin: 0;
    margin-bottom: 32px;
  }

  p {
    font-weight: 400;
    font-size: 18px;
    margin: 0;
    line-height: 28px;
    margin-left: 24px;
  }

  img {
    float: left;
    margin-left: 24px;
    margin-right: 36px;
    margin-bottom: 24px;
  }

  &:before {
    content: "";
    position: absolute;
    top: 24px;
    bottom: 24px;
    left: -24px;
    right: -24px;
    background: #fff;
    z-index: -1;
  }

  &:after {
    content: "";
    position: absolute;
    top: -24px;
    bottom: -24px;
    left: 24px;
    right: 24px;
    background: #fff;
    z-index: -1;
  }

  @media screen and (max-width: 1000px) {
    max-width: calc(100vw - 128px);
  }

  @media screen and (max-width: 720px) {
    img {
      float: none;
      margin: 0;
      margin-bottom: 24px;
    }
    h2 {
      font-size: 24px;
    }
    p {
      margin: 0;
      font-size: 16px;
    }
  }
`;

const InfoCard = ({ children }) => {
  return <InfoCardContainer>{children}</InfoCardContainer>;
};

export default InfoCard;
