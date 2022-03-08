const errorRenderer = error => (
    <div style={{ color: "red" }}>Please answer this question!</div>
);

const config = {
    fields: (data) => {
        return [
            {
                id: "q4",
                label: "Question 4: What is a myth?",
                options: [
                    { value: "a", text: "Sharks don't get cancer." }, // correct
                    { value: "b", text: "The price of diamonds is kept artificially high." },
                    { value: "c", text: "The Dalai Lama worked for the CIA." }
                ],
                secondaryText: data.q4 ? data.q4 === "a" ? "Correct!" : "Wrong!" : "",
                type: "radio",
                isRequired: true,
                isDisabled: !!data.q4,
                errorRenderer: errorRenderer
            },
            {
                id: "q5",
                label: "Question 5: What is biggest?",
                options: [
                    { value: "a", text: "One Gigabit?" },
                    { value: "b", text: "One GigaByte?" },
                    { value: "c", text: "One PetaByte?" } // correct
                ],
                secondaryText: data.q5 ? data.q5 === "c" ? "Correct!" : "Wrong!" : "",
                type: "radio",
                isRequired: true,
                isDisabled: !!data.q5,
                errorRenderer: errorRenderer
            },
            {
                id: "q6",
                label: "Question 6: Who invented alternating current (AC)?",
                options: [
                    { value: "a", text: "Nikola Tesla" },
                    { value: "b", text: "Thomas Edison" },
                    { value: "c", text: "Hippolyte Pixii" } // correct
                ],
                secondaryText: data.q6 ? data.q6 === "c" ? "Correct!" : "Wrong!" : "",
                type: "radio",
                isRequired: true,
                isDisabled: !!data.q6,
                errorRenderer: errorRenderer
            }
        ];
    }
};

export default config;