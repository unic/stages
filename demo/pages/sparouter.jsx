import React, { Fragment } from "react";
import { Stages, HashRouter } from "react-stages";
import Layout from "../components/Layout";

import Navigation from "../components/WizardNavigation";

// Note: We will soon add features to make this usecase a lot easier!

function SPAPage() {
    return (
        <Layout>
            <p>Stages is not really made for general SPA (Single Page App) routing, but you can certainly use it for that:</p>
            <Stages
                validateOnStepChange={false}
                render={({ navigationProps, routerProps, steps }) => (
                    <div class="pure-g">
                        <div class="pure-u-1-5" style={{ marginTop: "64px" }}>
                            <Navigation {...navigationProps} />
                        </div>
                        <div class="pure-u-4-5">{steps}</div>
                        {typeof window !== "undefined" ? <HashRouter {...routerProps} /> : null}
                    </div>
                )}
            >
                {({ isActive, data, onChange, onNav, index, setStepKey, initializing }) => {
                    const key = setStepKey("home", index);
                    if (initializing) return null;
                    if (!isActive) return <Fragment key={`step-${key}`}></Fragment>;
                    if (!data || Object.keys(data).length === 0) onChange({visited: true}, {}, index);

                    return (
                        <Fragment key={`step-${key}`}>
                            <h2>Home</h2>
                            <p>Page content ...</p>
                            <button type="button" onClick={() => onNav("step", "about")}>Read the About</button>
                        </Fragment>
                    );
                }}
                {({ isActive, data, onNav, onChange, index, setStepKey, initializing }) => {
                    const key = setStepKey("about", index);
                    if (initializing) return null;
                    if (!isActive) return <Fragment key={`step-${key}`}></Fragment>;
                    if (!data || Object.keys(data).length === 0) onChange({visited: true}, {}, index);

                    return (
                        <Fragment key={`step-${key}`}>
                            <h2>About</h2>
                            <p>Page content ...</p>
                            <button type="button" onClick={() => onNav("step", "home")}>Go back to Home</button>
                        </Fragment>
                    );
                }}
            </Stages>
        </Layout>
    );
};
  
export default SPAPage;