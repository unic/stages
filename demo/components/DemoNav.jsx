import Link from 'next/link';

const StyledLi = ({ children }) => {
    return (
        <li
            style={{
                padding: "4px 8px",
                margin: "0 8px"
            }}
        >
            {children}
        </li>
    );
};

const DemoNav = () => {
    return (
        <div
            style={{
                background: "#333",
                color: "#eee",
                padding: "6px 8px 4px 8px",
                marginBottom: "32px",
                fontFamily: "Helvetica, Arial, Sans"
            }}
        >
            <h1
                style={{
                    float: "left",
                    margin: 0,
                    fontSize: "20px"
                }}
            >Stages Demos:</h1>
            <ul style={{
                listStyleType: "none",
                display: "flex",
                margin: 0,
                lineHeight: "1"
            }}>
                <StyledLi>
                    <Link href="/">
                        <a style={{ color: "#fff" }}>&#8962;</a>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/form">
                        <a style={{ color: "#fff" }}>Simple Form</a>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/wizard">
                        <a style={{ color: "#fff" }}>Simple Wizard</a>
                    </Link>
                </StyledLi>
            </ul>  
        </div>
    );
};

export default DemoNav;