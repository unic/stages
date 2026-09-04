import App from "../components/App";
import "../styles/globals.css";

const MyApp = ({ Component, pageProps }) => {
  return <App><Component {...pageProps} /></App>;
};

export default MyApp;
