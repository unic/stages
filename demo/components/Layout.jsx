import Head from 'next/head';
import DemoNav from "./DemoNav";
import { Debugger } from "react-stages";

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
            </Head>
            <DemoNav />
            <div
                style={{
                    margin: "32px 4px 32px 32px",
                    position: "relative"
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "-52px",
                        right: "8px",
                        width: "320px",
                        padding: "8px",
                        fontSize: "14px",
                        color: "#944",
                        border: "1px #baa solid",
                        borderRadius: "4px",
                        background: "#fee"
                    }}
                >
                    <strong>Note:</strong> Stages comes without styles, you have to bring your own!
                </div>
                <div
                style={{
                    margin: "64px 0 0 0",
                    position: "relative"
                }}
                ><Debugger /></div>
                <div style={{ maxWidth: "960px" }}>
                    {children}
                </div>
            </div>
        </> 
    );
};

export default Layout;