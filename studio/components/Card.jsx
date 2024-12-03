import styled from "@emotion/styled";
import { motion } from "framer-motion";

const CardContainer = styled.div`
  position: relative;
  z-index: 10;
  height: calc(100% - 32px);
  margin-bottom: 32px;

  & > div {
    align-items: left;
    height: 100%;
    padding: 24px;
    border: 1px #000 solid;
    background: #fff;
  }

  h3 {
    font-weight: 700;
    font-size: 20px;
    font-style: italic;
    margin: 0;
    margin-bottom: 16px;
  }

  p {
    font-weight: 400;
    font-size: 16px;
    margin: 0;
    line-height: 25px;
  }

  &:before {
    display: block;
    position: absolute;
    top: -24px;
    left: calc(100% / 4);
    content: "";
    width: calc(100% / 2);
    height: calc(100% + 48px);
    background: #a0f9ff;
    transform: skew(-15deg, 0deg);
    z-index: -1;
    mix-blend-mode: darken;
  }

  &:after {
    display: block;
    position: absolute;
    top: 8px;
    left: 8px;
    content: "";
    width: 100%;
    height: 100%;
    border: 1px #ff485e solid;
    z-index: -2;
  }
`;

const Card = ({ children }) => {
  return (
    <CardContainer>
      <motion.div
        whileHover={{
          marginLeft: "-8px",
          marginTop: "-8px",
          paddingLeft: "32px",
          paddingTop: "32px",
        }}
      >
        {children}
      </motion.div>
    </CardContainer>
  );
};

export default Card;
