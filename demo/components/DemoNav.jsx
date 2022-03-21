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
                padding: 0,
                marginBottom: "32px",
                minHeight: "28px",
                fontFamily: "Helvetica, Arial, Sans"
            }}
        >
            <h1
                style={{
                    float: "left",
                    margin: 0,
                    padding: "4px 8px",
                    fontSize: "16px",
                    minHeight: "20px",
                    background: "#666"
                }}
            >Stages Demos</h1>
            <ul style={{
                listStyleType: "none",
                display: "flex",
                margin: 0,
                padding: "2px 0",
                lineHeight: "1"
            }}>
                <StyledLi>
                    <Link href="/">
                        <a style={{ color: "#fff", textDecoration: "none" }}>Simple Form</a>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/wizard">
                        <a style={{ color: "#fff", textDecoration: "none" }}>Simple Wizard</a>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/slideshow">
                        <a style={{ color: "#fff", textDecoration: "none" }}>Simple Slideshow</a>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/quiz">
                        <a style={{ color: "#fff", textDecoration: "none" }}>Quiz</a>
                    </Link>
                </StyledLi>
            </ul>  
        </div>
    );
};

export default DemoNav;