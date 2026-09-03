import { PrimeReactProvider } from "@primereact/core";
import Aura from "@primeuix/themes/aura";
import App from "../components/App";
import "../styles/globals.css";

import "primeflex/primeflex.css";
import "primeflex/themes/primeone-light.css";

const MyApp = ({ Component, pageProps }) => {
  return (
    <PrimeReactProvider theme={{ preset: Aura }}>
      <App>
        <Component {...pageProps} />
      </App>
    </PrimeReactProvider>
  );
};

export default MyApp;
