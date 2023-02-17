import Head from 'next/head';
import DemoNav from "./DemoNav";

const Layout = ({ children }) => {
    return (
        <>
            <Head>
                <link
                    rel="stylesheet"
                    href="https://unpkg.com/purecss@2.1.0/build/pure-min.css"
                    integrity="sha384-yHIFVG6ClnONEA5yB5DJXfW2/KC173DIQrYoZMEtBvGzmf0PKiGyNEqe9N6BNDBH"
                    crossorigin="anonymous"
                />
                <style>{`
                    a {
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                `}</style>
            </Head>
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