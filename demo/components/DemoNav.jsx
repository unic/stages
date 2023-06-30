import React from "react";
import { useRouter } from "next/router";
import { Debugger } from "react-stages";

const DemoNav = () => {
    const router = useRouter();

    return (
        <div style={{ display: "flex", borderBottom: "1px #ccc dashed", padding: "6px 0", background: "#f8f8f8" }}>
            <div>
                <h1
                    style={{
                        float: "left",
                        padding: "8px 4px 6px 8px",
                        fontSize: "18px",
                        lineHeight: "14px",
                        height: "100%",
                        margin: "8px"
                    }}
                >Stages Demos:</h1>
                <select onChange={e => router.push(e.target.value)} style={{ marginTop: "12px" }} defaultValue={router.pathname}>
                    <option value="/">Demos Overview</option>
                    <optgroup label="Form">
                        <option value="/simple">Simple Form</option>
                        <option value="/disabled">Disabled Form</option>
                        <option value="/asyncdata">Async Data</option>
                        <option value="/validateon">Validate On</option>
                        <option value="/isdirty">Is Dirty</option>
                        <option value="/undo">Undo / Redo</option>
                        <option value="/interfacestate">Interface State</option>
                        <option value="/subform">Subform</option>
                        <option value="/configtemplates">Config Templates</option>
                        <option value="/fieldsets">Fieldsets</option>
                        <option value="/i18n">i18n</option>
                        <option value="/autosave">Auto Save</option>
                    </optgroup>
                    <optgroup label="Fields">
                        <option value="/dynamicfields">Dynamic Fields</option>
                        <option value="/dynamicoptions">Dynamic Options</option>
                        <option value="/computedoptions">Computed Options</option>
                        <option value="/dynamicvalues">Dynamic Values</option>
                        <option value="/groups">Groups</option>
                        <option value="/customerrors">Custom Errors</option>
                        <option value="/typecasting">Typecasting</option>
                        <option value="/functionprops">Function Props</option>
                        <option value="/wysiwyg">WYSIWYG Editor</option>
                    </optgroup>
                    <optgroup label="Collections">
                        <option value="/collections">Collections</option>
                        <option value="/collectionrules">Collection Rules</option>
                        <option value="/collectionsort">Collection Sort (Kanban)</option>
                    </optgroup>
                    <optgroup label="Wizard">
                       <option value="/wizard">Simple Wizard</option>
                       <option value="/dynamicsteps">Dynamic Steps</option>
                       <option value="/stepsummaries">Step Summaries</option>
                       <option value="/wizardnavigation">Wizard Navigation</option>
                    </optgroup>
                    <optgroup label="Various">
                        <option value="/slideshow">Slideshow</option>
                        <option value="/quiz">Quiz</option>
                        <option value="/sparouter">SPA Router</option>
                    </optgroup>
                </select>
            </div>
            <div
                style={{
                    fontSize: "14px",
                    color: "#c03",
                    padding: "7px 32px"
                }}
            >
                <span style={{ fontSize: "24px", verticalAlign: "-1px" }}>[</span> <strong>Note:</strong> Stages comes without styles, you have to bring your own! <span style={{ fontSize: "24px", verticalAlign: "-1px" }}>]</span>
            </div>
            <div>
                <Debugger />
            </div>
        </div>
    );
};

export default DemoNav;