const errorRenderer = error => (
    <div style={{ color: "red" }}>Please answer this question!</div>
);

const config = {
    fields: (data) => {
        return [
            {
                id: "q1",
                label: "Question 4: What is a myth?",
                options: [
                    { value: "a", text: "Sharks don't get cancer." }, // correct
                    { value: "b", text: "The price of diamonds is kept artificially high." },
                    { value: "c", text: "The Dalai Lama worked for the CIA." }
                ],
                secondaryText: data.q1 ? data.q1 === "a" ? "Correct!" : "Wrong!" : "",
                type: "radio",
                isRequired: true,
                isDisabled: !!data.q1,
                errorRenderer: errorRenderer
            },
            {
                id: "q2",
                label: "Question 5: What is biggest?",
                options: [
                    { value: "a", text: "One Gigabit?" },
                    { value: "b", text: "One GigaByte?" },
                    { value: "c", text: "One PetaByte?" } // correct
                ],
                secondaryText: data.q2 ? data.q2 === "c" ? "Correct!" : "Wrong!" : "",
                type: "radio",
                isRequired: true,
                isDisabled: !!data.q2,
                errorRenderer: errorRenderer
            },
            {
                id: "q3",
                label: "Question 6: Who invented alternating current (AC)?",
                options: [
                    { value: "a", text: "Nikola Tesla" },
                    { value: "b", text: "Thomas Edison" },
                    { value: "c", text: "Hippolyte Pixii" } // correct
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
                    if (data.q1 && data.q1 === "a") correctAnwsers++;
                    if (data.q2 && data.q2 === "c") correctAnwsers++;
                    if (data.q3 && data.q3 === "c") correctAnwsers++;
                    return correctAnwsers;
                }
            }
        ];
    }
};

export default config;