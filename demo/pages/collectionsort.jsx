import React, { useState } from "react";
import { Form } from "react-stages";
import fields from "../components/demofields";
import Layout from "../components/Layout";
import Paragraph from "../components/demofields/parts/Paragraph";
import Heading from "../components/demofields/parts/Heading";

function FormPage() {
    const [data, setData] = useState({
        tasks: [
            {
                title: "Clean up the house",
                assignee: "hm@domain.com",
                priority: 3,
                storypoints: 2,
                status: "new"
            },
            {
                title: "Bring the dog out",
                assignee: "vb@domain.com",
                priority: 2,
                storypoints: 1,
                status: "new"
            },
            {
                title: "Create a new Stages demo",
                assignee: "",
                priority: 2,
                storypoints: 3,
                status: "progress"
            },
            {
                title: "Move plants towards sun",
                assignee: "hm@domain.com",
                priority: 2,
                storypoints: 5,
                status: "progress"
            },
            {
                title: "Go to bed early",
                assignee: "",
                priority: 1,
                storypoints: 1,
                status: "progress"
            },
            {
                title: "Eat some healthy food",
                assignee: "vb@domain.com",
                priority: 1,
                storypoints: 3,
                status: "done"
            }
        ],
        members: [
            {
                email: "hm@domain.com",
                name: "Hans Muster"
            },
            {
                email: "vb@domain.com",
                name: "Vreni Beispiel"
            }
        ]
    });

    const sumStoryPoints = (data, status) => {
        let sum = 0;
        if (data && data.tasks) {
            data.tasks.forEach(item => {
                if (item.status === status) sum += Number(item.storypoints);
            });
        }
        return sum;
    };

    return (
        <Layout>
            <Form
                data={data}
                fields={fields}
                enableUndo
                autoSave={{
                    type: "local",
                    validDataOnly: false
                }}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "tasks",
                                label: "Tasks",
                                type: "collection",
                                sort: {
                                    by: ["priority"],
                                    dir: "desc"
                                },
                                init: true,
                                fields: [
                                    {
                                        id: "title",
                                        label: "Title",
                                        type: "text",
                                        highlighted: true,
                                        isRequired: true,
                                        hideDebugInfo: true
                                    },
                                    {
                                        id: "assignee",
                                        type: "select",
                                        label: "Assignee",
                                        hideDebugInfo: true,
                                        computedOptions: {
                                            source: "members",
                                            initWith: [
                                                { value: "", text: "Unassigned" }
                                            ],
                                            map: (item) => {
                                                return {
                                                    value: item.email,
                                                    text: item.name
                                                };
                                            },
                                            sort: (a, b) => a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
                                            filter: (item) => !!item.email
                                        }
                                    },
                                    {
                                        id: "priority",
                                        label: "Priority",
                                        type: "select",
                                        options: [
                                            { value: 0, text: "Please select" },
                                            { value: 1, text: "Minor" },
                                            { value: 2, text: "Major" },
                                            { value: 3, text: "Blocker" }
                                        ],
                                        isRequired: true,
                                        hideDebugInfo: true
                                    },
                                    {
                                        id: "status",
                                        label: "Status",
                                        type: "radio",
                                        options: [
                                            { value: "new", text: "New" },
                                            { value: "progress", text: "In Progress" },
                                            { value: "done", text: "Done" }
                                        ],
                                        isRequired: true,
                                        hideDebugInfo: true
                                    },
                                    {
                                        id: "storypoints",
                                        label: "Story Points",
                                        type: "number",
                                        defaultValue: 0,
                                        hideDebugInfo: true
                                    },
                                ]
                            },
                            {
                                id: "members",
                                label: "Team Members",
                                type: "collection",
                                init: true,
                                min: 1,
                                fields: [
                                    {
                                        id: "email",
                                        label: "Email",
                                        type: "email",
                                        isRequired: true,
                                        isUnique: true,
                                        hideDebugInfo: true
                                    },
                                    {
                                        id: "name",
                                        label: "Name",
                                        type: "text",
                                        isRequired: true,
                                        hideDebugInfo: true
                                    },
                                    {
                                        id: "upcoming",
                                        label: "Upcoming",
                                        type: "number",
                                        isDisabled: true,
                                        hideDebugInfo: true,
                                        computedValue: (data, itemData) => {
                                            let sum = 0;
                                            if (data && data.tasks) {
                                                data.tasks.forEach(item => {
                                                    if (item.assignee === itemData.email && item.status === "new") sum += Number(item.storypoints);
                                                });
                                            }
                                            return sum;
                                        }
                                    },
                                    {
                                        id: "progress",
                                        label: "Current",
                                        type: "number",
                                        isDisabled: true,
                                        hideDebugInfo: true,
                                        computedValue: (data, itemData) => {
                                            let sum = 0;
                                            if (data && data.tasks) {
                                                data.tasks.forEach(item => {
                                                    if (item.assignee === itemData.email && item.status === "progress") sum += Number(item.storypoints);
                                                });
                                            }
                                            return sum;
                                        }
                                    },
                                    {
                                        id: "done",
                                        label: "Done",
                                        type: "number",
                                        isDisabled: true,
                                        hideDebugInfo: true,
                                        computedValue: (data, itemData) => {
                                            let sum = 0;
                                            if (data && data.tasks) {
                                                data.tasks.forEach(item => {
                                                    if (item.assignee === itemData.email && item.status === "done") sum += Number(item.storypoints);
                                                });
                                            }
                                            return sum;
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <Heading>Collection Sort (Kanban Board):</Heading>
                        <Paragraph>
                            In this example we demonstrate two things. First we have a collection of tasks, which is sorted by 
                            its priority field. Blockers first, than manjor and finally minor tasks. Second, we have split 
                            the collections by it's status field. We can easily achive this by ignoring all entries in a 
                            collection that have the wrong status while looping over the items and than do this three times by it's status. 
                            All entries without status, we display above the "Kanban" board. And to illustrate the power of collections 
                            further, you can add additional team members which can than be assigned to tasks. And everything is auto saved, 
                            so pretty functional already for an easy to setup Kanban board.
                        </Paragraph>
                        <div>
                            <button type="button" onClick={() => fieldProps.onCollectionAction("tasks", "add")}>+</button>
                            {" | "}
                            <button onClick={actionProps.handleUndo}>Undo</button>
                            {" "}
                            <button onClick={actionProps.handleRedo}>Redo</button>
                            <br /><br />
                            {fieldProps.fields.tasks ? fieldProps.fields.tasks.map((subFields, index) => {
                                    const itemData = fieldProps.get(fieldProps.data, `tasks[${index}].status`);
                                    if (itemData) return null;
                                    return (
                                        <div key={`task-${index}`} style={{ display: "flex" }}>
                                            {subFields.title}
                                            {subFields.assignee}
                                            {subFields.priority}
                                            {subFields.storypoints}
                                            {subFields.status}
                                        </div>
                                    );
                                }) : null}
                        </div>
                        <br />
                        <div style={{ display: "flex" }}>
                            <fieldset style={{ flexGrow: 1, padding: "0", border: "none", background: "#eee" }}>
                                <h3 style={{ padding: "8px", margin: 0 }}>New ({sumStoryPoints(fieldProps.data, "new")} Story Points):</h3>
                                {fieldProps.fields.tasks ? fieldProps.fields.tasks.map((subFields, index) => {
                                    const itemData = fieldProps.get(fieldProps.data, `tasks[${index}].status`);
                                    if (itemData !== "new") return null;
                                    return (
                                        <div key={`task-${index}`} style={{ background: "#fff", margin: "8px", padding: "8px", display: "flex" }}>
                                            <div style={{ background: "#fff", margin: "8px", padding: "8px", display: "flex", flexDirection: "column" }}>
                                                {subFields.title}
                                                {subFields.assignee}
                                                {subFields.priority}
                                                {subFields.storypoints}
                                                {subFields.status}
                                            </div>
                                            <button type="button" onClick={() => fieldProps.onCollectionAction("tasks", "remove", index)}>-</button>
                                        </div>
                                    );
                                }) : null}
                            </fieldset>
                            <fieldset style={{ flexGrow: 1, padding: "0", border: "none", background: "#eee" }}>
                                <h3 style={{ padding: "8px", margin: 0 }}>In Progress ({sumStoryPoints(fieldProps.data, "progress")} Story Points):</h3>
                                {fieldProps.fields.tasks ? fieldProps.fields.tasks.map((subFields, index) => {
                                    const itemData = fieldProps.get(fieldProps.data, `tasks[${index}].status`);
                                    if (itemData !== "progress") return null;
                                    return (
                                        <div key={`task-${index}`} style={{ background: "#fff", margin: "8px", padding: "8px", display: "flex" }}>
                                            <div style={{ background: "#fff", margin: "8px", padding: "8px", display: "flex", flexDirection: "column" }}>
                                                {subFields.title}
                                                {subFields.assignee}
                                                {subFields.priority}
                                                {subFields.storypoints}
                                                {subFields.status}
                                            </div>
                                            <button type="button" onClick={() => fieldProps.onCollectionAction("tasks", "remove", index)}>-</button>
                                        </div>
                                    );
                                }) : null}
                            </fieldset>
                            <fieldset style={{ flexGrow: 1, padding: "0", border: "none", background: "#eee" }}>
                                <h3 style={{ padding: "8px", margin: 0 }}>Done ({sumStoryPoints(fieldProps.data, "done")} Story Points):</h3>
                                {fieldProps.fields.tasks ? fieldProps.fields.tasks.map((subFields, index) => {
                                    const itemData = fieldProps.get(fieldProps.data, `tasks[${index}].status`);
                                    if (itemData !== "done") return null;
                                    return (
                                        <div key={`task-${index}`} style={{ background: "#fff", margin: "8px", padding: "8px", display: "flex" }}>
                                            <div style={{ background: "#fff", margin: "8px", padding: "8px", display: "flex", flexDirection: "column" }}>
                                                {subFields.title}
                                                {subFields.assignee}
                                                {subFields.priority}
                                                {subFields.storypoints}
                                                {subFields.status}
                                            </div>
                                            <button type="button" onClick={() => fieldProps.onCollectionAction("tasks", "remove", index)}>-</button>
                                        </div>
                                    );
                                }) : null}
                            </fieldset>
                        </div>
                        <br />
                        <fieldset style={{ flexGrow: 1, padding: "0", border: "none", background: "#eee" }}>
                            <h3 style={{ padding: "8px", margin: 0 }}>Team Members:</h3>
                            {fieldProps.fields.members ? fieldProps.fields.members.map((subFields, index) => (
                                <div key={`members-${index}`} style={{ background: "#fff", margin: "8px", padding: "8px", display: "flex" }}>
                                    {subFields.email}
                                    {subFields.name}
                                    <div style={{ display: "flex", padding: "8px" }}>
                                        <h3>Work:</h3>
                                        {subFields.upcoming}
                                        {subFields.progress}
                                        {subFields.done}
                                    </div>
                                    <button type="button" onClick={() => fieldProps.onCollectionAction("members", "remove", index)}>-</button>
                                </div>
                            )) : null}
                            <button type="button" onClick={() => fieldProps.onCollectionAction("members", "add")}>+</button>
                        </fieldset>
                    </>
                )}
                onChange={payload => setData(payload)}
            /> 
        </Layout>
    );
};
  
export default FormPage;