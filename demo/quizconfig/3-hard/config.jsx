const errorRenderer = error => (
    <div style={{ color: "red" }}>Please answer this question!</div>
);

const config = {
    fields: (data) => {
        return [
            {
                id: "q7",
                label: "Question 7: What year did Vincent Van Gogh die?",
                options: [
                    { value: "a", text: "1803" },
                    { value: "b", text: "1858" },
                    { value: "c", text: "1890" } // correct
                ],
                secondaryText: data.q7 ? data.q7 === "c" ? "Correct!" : "Wrong!" : "",
                type: "radio",
                isRequired: true,
                isDisabled: !!data.q7,
                errorRenderer: errorRenderer
            },
            {
                id: "q8",
                label: "Question 8: How many languages has Harry Potter been translated into?",
                options: [
                    { value: "a", text: "27" },
                    { value: "b", text: "68" }, // correct
                    { value: "c", text: "112" }
                ],
                secondaryText: data.q8 ? data.q8 === "b" ? "Correct!" : "Wrong!" : "",
                type: "radio",
                isRequired: true,
                isDisabled: !!data.q8,
                errorRenderer: errorRenderer
            },
            {
                id: "q9",
                label: "Question 9: When was the LEGO brick invented?",
                options: [
                    { value: "a", text: "1958" }, // correct
                    { value: "b", text: "1967" },
                    { value: "c", text: "1974" }
                ],
                secondaryText: data.q9 ? data.q9 === "a" ? "Correct!" : "Wrong!" : "",
                type: "radio",
                isRequired: true,
                isDisabled: !!data.q9,
                errorRenderer: errorRenderer
            }
        ];
    }
};

export default config;