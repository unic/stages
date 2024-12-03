import { PrimeReactProvider } from 'primereact/api';
import App from '../components/App';
import '../styles/globals.css';

import "../node_modules/primereact/resources/themes/lara-light-cyan/theme.css";
import "../node_modules/primeflex/primeflex.css";
import "../node_modules/primeflex/themes/primeone-light.css";

const MyApp = ({ Component, pageProps }) => {
    const value = {};

    return (
        <PrimeReactProvider value={value}>
            <App>
                <Component {...pageProps} />
            </App>
        </PrimeReactProvider>
    );
};

export default MyApp;