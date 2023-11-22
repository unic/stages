import { PrimeReactProvider } from 'primereact/api';
import App from '../components/App';

import "primereact/resources/themes/bootstrap4-light-blue/theme.css";
import "primeflex/primeflex.css";
import "primeflex/themes/primeone-light.css";

const MyApp = ({ Component, pageProps }) => {
    const value = {
        appendTo: 'self',
    };

    return (
        <PrimeReactProvider value={value}>
            <App>
                <Component {...pageProps} />
            </App>
        </PrimeReactProvider>
    );
};

export default MyApp;