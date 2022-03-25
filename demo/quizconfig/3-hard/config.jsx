const errorRenderer = error => (
    <div style={{ color: "red" }}>Please answer this question!</div>
);

const QuestionResult = ({ data, correct }) => (
    <div style={{ marginTop: "4px", color: data === correct ? "#f00" : "#693", height: "16px" }}>
        {data ? data === correct ? "Correct!" : "Wrong!" : ""}
    </div>
);

const config = {
    fields: (data) => {
        return [
            {
                id: "q1",
                label: "Question 7: What year did Vincent Van Gogh die?",
                options: [
                    { value: "a", text: "1803" },
                    { value: "b", text: "1858" },
                    { value: "c", text: "1890" } // correct
                ],
                secondaryText: <QuestionResult data={data.q1} correct="c" />,
                type: "radio",
                isRequired: true,
                isDisabled: !!data.q1,
                errorRenderer: errorRenderer
            },
            {
                id: "q2",
                label: "Question 8: How many languages has Harry Potter been translated into?",
                options: [
                    { value: "a", text: "27" },
                    { value: "b", text: "68" }, // correct
                    { value: "c", text: "112" }
                ],
                secondaryText: <QuestionResult data={data.q2} correct="b" />,
                type: "radio",
                isRequired: true,
                isDisabled: !!data.q2,
                errorRenderer: errorRenderer
            },
            {
                id: "q3",
                label: "Question 9: When was the LEGO brick invented?",
                options: [
                    { value: "a", text: "1958" }, // correct
                    { value: "b", text: "1967" },
                    { value: "c", text: "1974" }
                ],
                secondaryText: <QuestionResult data={data.q3} correct="a" />,
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
                    if (data.q3 && data.q3 === "a") correctAnwsers++;
                    return correctAnwsers;
                }
            }
        ];
    }
};

export default config;