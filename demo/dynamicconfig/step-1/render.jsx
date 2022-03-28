import React from "react";

const FormRenderer = ({ fields }) => {
    return (
        <div>
            <p>
                Steps can be shown or hidden dynamically based on filled in data. In this example 
                we have two checkboxes on the first step, which when checked will enable those 
                individual steps. Try it!
            </p>
            <br />
            {fields.step2}
            <br />
            {fields.step3}
        </div>
    );
};

export default FormRenderer;