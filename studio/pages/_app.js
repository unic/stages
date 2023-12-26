import { PrimeReactProvider } from 'primereact/api';
import App from '../components/App';
import '../styles.css';

import "primeflex/primeflex.css";
import "primereact/resources/themes/bootstrap4-light-blue/theme.css";
import "primeflex/themes/primeone-light.css";
import "../public/studio-styles.css";

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