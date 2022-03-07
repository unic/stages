import React, { Fragment } from "react";
import UseKey from 'react-use/lib/component/UseKey';
import { Stages, Progression, HashRouter } from "react-stages";
import DemoNav from "../components/DemoNav";

const SlideShowContainer = ({ children }) => {
    return (
        <div style={{
            width: "100%",
            height: "calc(100vh - 140px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "#000",
            textAlign: "center",
            marginTop: "18%",
            fontSize: "2em",
            fontFamily: "Open Sans, Helvetia, sans"
        }}>
            {children}
        </div>
    );
};

const PrevNav = ({ children }) => {
    return (
        <div
            style={{
                position: "absolute",
                top: "70px",
                left: 0,
                display: "flex",
                alignItems: "center",
                width: "44px",
                height: "calc(100vh - 140px)",
                padding: "10px"
            }}
        >
            {children}
        </div>
    );
}

const NextNav = ({ children }) => {
    return (
        <div
            style={{
                position: "absolute",
                top: "70px",
                right: 0,
                display: "flex",
                alignItems: "center",
                width: "44px",
                height: "calc(100vh - 140px)",
                padding: "10px",
                textAlign: "right"
            }}
        >
            {children}
        </div>
    );
}

function SlideshowPage() {
    return (
        <div>
            <DemoNav />
            <Stages
                initialData={{}}
                render={({ navigationProps, progressionProps, routerProps, steps }) => (
                    <div>
                        {steps}
                        <div style={{marginLeft: "50%", marginRight: "50%", width: "90px"}}><Progression {...progressionProps} /></div>
                        {typeof window !== "undefined" ? <HashRouter {...routerProps} /> : null}
                    </div>
                )}
            >
                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                    const key = setStepKey("slide1", index);
                    if (initializing) return null;

                    if (!isActive) return <Fragment key={`step-${key}`}></Fragment>;
                    if (!data || Object.keys(data).length === 0) onChange({visited: true}, {}, index);

                    return (
                        <Fragment key={`step-${key}`}>
                            <SlideShowContainer onKeyDown={(e) => console.log(e)/*e.keyCode === 38 ? onNav("prev") : e.keyCode === 40 ? onNav("next") : () => {}*/ }>
                                <h2>Slide 1</h2>
                                <p>Just a basic demo of a slideshow made with Stages ...</p>
                            </SlideShowContainer>
                            <PrevNav><button type="button" onClick={() => onNav("prev")}>Prev</button></PrevNav>
                            <NextNav><button type="button" onClick={() => onNav("next")}>Next</button></NextNav>
                            <UseKey filter='ArrowLeft' fn={() => onNav("prev")} />
                            <UseKey filter='ArrowRight' fn={() => onNav("next")} />
                        </Fragment>
                    );
                }}
                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                    const key = setStepKey("slide2", index);
                    if (initializing) return null;

                    if (!isActive) return <Fragment key={`step-${key}`}></Fragment>;
                    if (!data || Object.keys(data).length === 0) onChange({visited: true}, {}, index);

                    return (
                        <Fragment key={`step-${key}`}>
                            <SlideShowContainer onKeyDown={(e) => e.keyCode === 38 ? onNav("prev") : e.keyCode === 40 ? onNav("next") : () => {} }>
                                <h2>Slide 2</h2>
                                <p>... to demonstrate that you don't need a form in stages ...</p>
                            </SlideShowContainer>
                            <PrevNav><button type="button" onClick={() => onNav("prev")}>Prev</button></PrevNav>
                            <NextNav><button type="button" onClick={() => onNav("next")}>Next</button></NextNav>
                            <UseKey filter='ArrowLeft' fn={() => onNav("prev")} />
                            <UseKey filter='ArrowRight' fn={() => onNav("next")} />
                        </Fragment>
                    );
                }}
                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                    const key = setStepKey("slide3", index);
                    if (initializing) return null;

                    if (!isActive) return <Fragment key={`step-${key}`}></Fragment>;
                    if (!data || Object.keys(data).length === 0) onChange({visited: true}, {}, index);

                    return (
                        <Fragment key={`step-${key}`}>
                            <SlideShowContainer onKeyDown={(e) => e.keyCode === 38 ? onNav("prev") : e.keyCode === 40 ? onNav("next") : () => {} }>
                                <h2>Slide 3</h2>
                                <p>... and that you can navigate however you want, with no valiudation!</p>
                            </SlideShowContainer>
                            <PrevNav><button type="button" onClick={() => onNav("prev")}>Prev</button></PrevNav>
                            <NextNav><button type="button" onClick={() => onNav("next")}>Next</button></NextNav>
                            <UseKey filter='ArrowLeft' fn={() => onNav("prev")} />
                            <UseKey filter='ArrowRight' fn={() => onNav("next")} />
                        </Fragment>
                    );
                }}
            </Stages>
        </div>

    );
};
  
export default SlideshowPage;