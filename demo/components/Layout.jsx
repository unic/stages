import DemoNav from "./DemoNav";

const Layout = ({ children }) => {
    return (
        <>
            <DemoNav />
            <div
                style={{
                    margin: "32px 4px 32px 32px",
                    position: "relative"
                }}
            >
                <div style={{ maxWidth: "1040px" }}>
                    {children}
                </div>
                <div style={{ padding: "16px 0", marginTop: "64px", fontSize: "12px", letterSpacing: "1px" }}>
                    - - -
                    <br />
                    (c) 2023 by Fredi Bach :  <a href="https://unic.com" style={{ color: "#000" }}>Unic</a> : {"  "} <a href="https://github.com/unic/stages" style={{ color: "#000" }}>Github</a>
                </div>
            </div>
        </> 
    );
};

export default Layout;