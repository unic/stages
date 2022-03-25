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
            </Head>
            <DemoNav />
            <div
                style={{
                    margin: "32px",
                    position: "relative"
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "-24px",
                        right: 0,
                        width: "240px",
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
                <div style={{ maxWidth: "900px" }}>
                    {children}
                </div>
            </div>
        </> 
    );
};

export default Layout;