const errorRenderer = error => (
    <div style={{ color: "red" }}>Please answer this question!</div>
);

const config = {
    fields: (data) => {
        return [
            {
                id: "q1",
                label: "Question 1: What is biggest?",
                options: [
                    { value: "a", text: "Earth" },
                    { value: "b", text: "Moon" },
                    { value: "c", text: "Sun" } // correct
                ],
                secondaryText: data.q1 ? data.q1 === "c" ? "Correct!" : "Wrong!" : "",
                type: "radio",
                isRequired: true,
                isDisabled: !!data.q1,
                errorRenderer: errorRenderer
            },
            {
                id: "q2",
                label: "Question 2: Which country isn't in Europe?",
                options: [
                    { value: "a", text: "Italy" },
                    { value: "b", text: "South Africa" }, // correct
                    { value: "c", text: "France" }
                ],
                secondaryText: data.q2 ? data.q2 === "b" ? "Correct!" : "Wrong!" : "",
                type: "radio",
                isRequired: true,
                isDisabled: !!data.q2,
                errorRenderer: errorRenderer
            },
            {
                id: "q3",
                label: "Question 3: What doesn't make people happy?",
                options: [
                    { value: "a", text: "A great song" },
                    { value: "b", text: "A smile" },
                    { value: "c", text: "Unwanted pain" } // correct
                ],
                secondaryText: data.q3 ? data.q3 === "c" ? "Correct!" : "Wrong!" : "",
                type: "radio",
                isRequired: true,
                isDisabled: !!data.q3,
                errorRenderer: errorRenderer
            },
            {
                id: "result",
                type: "text",
                isDisabled: true,
                computedValue: data => {
                    let correctAnwsers = 0;
                    if (data.q1 && data.q1 === "c") correctAnwsers++;
                    if (data.q2 && data.q2 === "b") correctAnwsers++;
                    if (data.q3 && data.q3 === "c") correctAnwsers++;
                    return correctAnwsers;
                }
            }
        ];
    }
};

export default config;