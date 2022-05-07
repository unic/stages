import React, { Fragment, useState } from "react";
import { Stages, Navigation, Progression, HashRouter } from "./lib/stages";
import { Form, Actions } from "./lib/form";
import fields from "./lib/fieldsets/plain";

import {
    basicsConfig, guestsConfig, programConfig,
    BasicsRenderer, GuestsRenderer, ProgramRenderer
} from "./components/steps/test";

const FormLayout = ({ loading, fields, actions }) => <div>
    {loading ? (
        <div>Loading data, please wait ...</div>
    ) : (
        <>
            {fields}
            <hr />
            {actions}
        </>
    )}
</div>;

export const getStateFromLocalStorage = () => {
	if (typeof localStorage !== "undefined") {
		const stringifiedStoredState = localStorage.getItem("stages-demo-app") || "{}";
		const storedState = JSON.parse(stringifiedStoredState);
		return storedState;
	}
	return {};
};

export const saveStateToLocalStorage = (state = {}) => {
	if (typeof localStorage !== "undefined") {
		const stringifiedState = JSON.stringify(state);
		localStorage.setItem("stages-demo-app", stringifiedState);
	}
};

function App() {
  const initialData = getStateFromLocalStorage();

  const handleChange = (data, errors) => {
    saveStateToLocalStorage(data);
  };

  const onSubmit = data => {
      console.log("submit:", data);
  };

  const createActionButtonConfig = (type, onNav, onSubmit, data) => {
      if (type === "first") {
          return [{
              title: "Next",
              type: "primary",
              validate: true,
              onClick: () => onNav("next")
          }];
      }
      return [
          {
              title: "Prev",
              type: "secondary",
              validate: false,
              onClick: () => onNav("prev")
          },
          {
              title: "Basics (Step 1)",
              type: "secondary",
              validate: false,
              onClick: () => onNav("step", "basics")
          },
          {
              title: type === "last" ? "Submit" : "Next",
              type: "primary",
              validate: true,
              onClick: () => type === "last" ? onSubmit(data) : onNav("next")
          }
      ];
  };

  return (
      <>
          <h1>Wizard</h1>
          <Stages
              initialData={initialData}
              onChange={({data, errors}) => handleChange(data, errors)}
              render={({ navigationProps, progressionProps, routerProps, steps }) => (
                  <div>
                      <Navigation {...navigationProps} />
                      <Progression {...progressionProps} />
                      {steps}
                      {typeof window !== "undefined" ? <HashRouter {...routerProps} /> : null}
                  </div>
              )}
          >
              {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                  const key = setStepKey("basics", index);
                  if (initializing) return null;

                  return (
                      <Fragment key={`step-${key}`}>
                          {isActive ? <h2>Basics:</h2> : null}
                          <Form
                              id={key}
                              data={data}
                              config={basicsConfig}
                              render={({ actionProps, fieldProps, loading }) => (
                                <div>
                                  <FormLayout
                                      loading={loading}
                                      fields={<BasicsRenderer {...fieldProps} />}
                                      actions={<Actions
                                          config={createActionButtonConfig("first", onNav, onSubmit, data)}
                                          {...actionProps}
                                      />}
                                  />
                                </div>
                              )}
                              fields={fields}
                              onChange={onChange}
                              isVisible={isActive}
                              validateOn={["action", "blur"]}
                          />
                      </Fragment>
                  );
              }}

              {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                  const key = setStepKey("guests", index);
                  if (initializing) return null;

                  if (allData.basics && allData.basics.password === "test1234") return null;

                  return (
                      <Fragment key={`step-${key}`}>
                          {isActive ? <h2>Guests:</h2> : null}
                          <Form
                              id={key}
                              data={data}
                              config={guestsConfig}
                              render={({ actionProps, fieldProps, loading }) => (
                                <div>
                                  <FormLayout
                                      loading={loading}
                                      fields={<GuestsRenderer {...fieldProps} />}
                                      actions={<Actions
                                          config={createActionButtonConfig("regular", onNav, onSubmit, data)}
                                          {...actionProps}
                                      />}
                                  />
                                </div>
                              )}
                              fields={fields}
                              onChange={onChange}
                              isVisible={isActive}
                              validateOn={["action", "blur"]}
                          />
                      </Fragment>
                  );
              }}

              {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                  const key = setStepKey("empty", index);
                  if (initializing) return null;

                  if (!isActive) return <Fragment key={`step-${key}`}></Fragment>;

                  // Validate this step on mount by adding random data to this steps data:
                  if (!data || Object.keys(data).length === 0) onChange({visited: true}, {}, index);

                  return (
                      <div key={`step-${key}`}>
                          <h2>An empty Step</h2>
                          <p>You don't need to put froms on a step!</p>
                          <button type="button" onClick={() => onNav("prev")}>Prev</button>
                          <button type="button" onClick={() => onNav("next")}>Next</button>
                      </div>
                  );
              }}

              {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                  const key = setStepKey("program", index);
                  if (initializing) return null;

                  return (
                      <Fragment key={`step-${key}`}>
                          {isActive ? <h2>Program:</h2> : null}
                          <Form
                              id={key}
                              data={data}
                              config={programConfig}
                              render={({ actionProps, fieldProps, loading }) => (
                                <div>
                                  <FormLayout
                                      loading={loading}
                                      fields={<ProgramRenderer {...fieldProps} />}
                                      actions={<Actions
                                          config={createActionButtonConfig("last", onNav, onSubmit, data)}
                                          {...actionProps}
                                      />}
                                  />
                                </div>
                              )}
                              fields={fields}
                              onChange={onChange}
                              isVisible={isActive}
                              validateOn={["action", "blur"]}
                          />
                      </Fragment>
                  );
              }}
          </Stages>
      </>
  );
}

export default App;
