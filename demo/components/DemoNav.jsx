import React from "react";
import Link from 'next/link';
import { useRouter } from "next/router";

const StyledLi = ({ children }) => {
    return (
        <li
            style={{
                padding: "4px 8px",
                margin: "8px 0 0 8px",
                whiteSpace: "nowrap",
                background: "#555"
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
                fontFamily: "Helvetica, Arial, Sans"
            }}
        >
            <h1
                style={{
                    float: "left",
                    padding: "5px 14px 6px 16px",
                    fontSize: "16px",
                    lineHeight: "14px",
                    height: "100%",
                    background: "#d30",
                    margin: "8px"
                }}
            >Stages Demos:</h1>
            <ul style={{
                listStyleType: "none",
                display: "flex",
                flexWrap: "wrap",
                margin: 0,
                padding: "0 0 8px 0",
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
                    <Link href="/dynamicfields">
                        <MenuItem active={router.pathname === "/dynamicfields"}>Dynamic Fields</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/dynamicoptions">
                        <MenuItem active={router.pathname === "/dynamicoptions"}>Dynamic Options</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/computedoptions">
                        <MenuItem active={router.pathname === "/computedoptions"}>Computed Options</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/dynamicvalues">
                        <MenuItem active={router.pathname === "/dynamicvalues"}>Dynamic Values</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/collections">
                        <MenuItem active={router.pathname === "/collections"}>Collections</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/collectionrules">
                        <MenuItem active={router.pathname === "/collectionrules"}>Collection Rules</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/groups">
                        <MenuItem active={router.pathname === "/groups"}>Groups</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/asyncdata">
                        <MenuItem active={router.pathname === "/asyncdata"}>Async Data</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/customerrors">
                        <MenuItem active={router.pathname === "/customerrors"}>Custom Errors</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/validateon">
                        <MenuItem active={router.pathname === "/validateon"}>Validate On</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/isdirty">
                        <MenuItem active={router.pathname === "/isdirty"}>Is Dirty</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/undo">
                        <MenuItem active={router.pathname === "/undo"}>Undo / Redo</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/interfacestate">
                        <MenuItem active={router.pathname === "/interfacestate"}>Interface State</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/typecasting">
                        <MenuItem active={router.pathname === "/typecasting"}>Typecasting</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/subform">
                        <MenuItem active={router.pathname === "/subform"}>Subform</MenuItem>
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
                    <Link href="/configtemplates">
                        <MenuItem  active={router.pathname === "/configtemplates"}>Config Templates</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/i18n">
                        <MenuItem  active={router.pathname === "/i18n"}>i18n</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/stepsummaries">
                        <MenuItem  active={router.pathname === "/stepsummaries"}>Step Summaries</MenuItem>
                    </Link>
                </StyledLi>
                <StyledLi>
                    <Link href="/wizardnavigation">
                        <MenuItem  active={router.pathname === "/wizardnavigation"}>Wizard Navigation</MenuItem>
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
                <StyledLi>
                    <Link href="/sparouter">
                        <MenuItem active={router.pathname === "/sparouter"}>SPA Router</MenuItem>
                    </Link>
                </StyledLi>
            </ul>  
        </div>
    );
};

export default DemoNav;