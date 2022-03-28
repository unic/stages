import React from "react";
import Link from 'next/link';
import { useRouter } from "next/router";

const StyledLi = ({ children }) => {
    return (
        <li
            style={{
                padding: "4px 0px 4px 8px",
                margin: "0 8px"
            }}
        >
            {children}
        </li>
    );
};

const MenuItem = React.forwardRef(({ onClick, href, children, active }, ref) => {
    return (
        <a href={href} onClick={onClick} ref={ref} style={{
            textDecoration: "none",
            color: active ? "#fff" : "#ccc",
            cursor: "pointer"
        }}>{children}</a>
    );
});

const DemoNav = () => {
    const router = useRouter();

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
                    padding: "4px 14px",
                    fontSize: "16px",
                    minHeight: "20px",
                    background: "#d30"
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
                        <MenuItem active={router.pathname === "/"}>Simple Form</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/disabled">
                        <MenuItem active={router.pathname === "/disabled"}>Disabled Form</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/collections">
                        <MenuItem active={router.pathname === "/collections"}>Collections</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/asyncdata">
                        <MenuItem active={router.pathname === "/asyncdata"}>Async Data</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/wizard">
                        <MenuItem  active={router.pathname === "/wizard"}>Simple Wizard</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/dynamicsteps">
                        <MenuItem  active={router.pathname === "/dynamicsteps"}>Dynamic Steps</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/slideshow">
                        <MenuItem active={router.pathname === "/slideshow"}>Simple Slideshow</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/quiz">
                        <MenuItem active={router.pathname === "/quiz"}>Quiz</MenuItem>
                    </Link>
                </StyledLi>
            </ul>  
        </div>
    );
};

export default DemoNav;