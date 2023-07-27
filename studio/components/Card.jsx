import styled from "@emotion/styled";

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
        top: -16px;
        left: calc(100% / 4);
        content: "";
        width: calc(100% / 2);
        height: calc(100% + 32px);
        background: #A0F9FF;
        transform: skew(-15deg, 0deg);
        z-index: -2;
    }

    &:after {
        display: block;
        position: absolute;
        top: -16px;
        left: calc(100% / 4);
        content: "";
        width: 16px;
        height: calc(100% + 32px);
        background: #FF485E;
        transform: skew(-15deg, 0deg);
        z-index: -1;
    }
`;

const Card = ({ children }) => {
    return (
        <CardContainer>
            <div>
                {children}
            </div>
        </CardContainer>
    );
};

export default Card;