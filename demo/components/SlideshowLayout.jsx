import Head from 'next/head';
import DemoNav from "./DemoNav";

const SlideshowLayout = ({ children }) => {
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
                {children}
            </div>
        </> 
    );
};

export default SlideshowLayout;