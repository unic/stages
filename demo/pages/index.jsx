import React from "react";
import Layout from "../components/Layout";
import Paragraph from "../components/demofields/parts/Paragraph";
import Heading from "../components/demofields/parts/Heading";

function FormPage() {
    return (
        <Layout>
            <Heading>Stages Demos</Heading>
            <Paragraph>
                Stages can do many things. The following Demos demonstrate most of those features. 
                Choose one of the demos above. More details about all the features can be found in the docs.
            </Paragraph>
            <Paragraph>
                <a href="https://stages-docs.vercel.app/" targte="_blank">Stages Docs</a>
            </Paragraph>
            <Paragraph>
                To make the demos more useful, additional info about the configured fields are rendered. This is only 
                for demo purposes. Plus there's a debugger on the lright top corner which you can use to inspect the data. 
                Additionally, as stages comes without any default styles, we decided 
                to use Pure CSS to make them look a little nicer. For your own implemtation, you have to bring 
                your own styles.
            </Paragraph>
            <Paragraph>
                As stages can be used for Forms, Wizards and various other usecases, we grouped the demos. 
                Here's an overview.
            </Paragraph>
            <Heading>Forms</Heading>
            <Paragraph>
                <a href="/simple">Simple Form</a>{", "}
                <a href="/disabled">Disabled Form</a>{", "}
                <a href="/asyncdata">Async Data</a>{", "}
                <a href="/validateon">Validate On</a>{", "}
                <a href="/isdirty">Is Dirty</a>{", "}
                <a href="/undo">Undo / Redo</a>{", "}
                <a href="/interfacestate">Interface State</a>{", "}
                <a href="/subform">Subform</a>{", "}
                <a href="/configtemplates">Config Templates</a>{", "}
                <a href="/i18n">i18n</a>
            </Paragraph>
            <Heading>Fields</Heading>
            <Paragraph>
                <a href="/dynamicfields">Dynamic Fields</a>{", "}
                <a href="/dynamicoptions">Dynamic Options</a>{", "}
                <a href="/computedoptions">Computed Options</a>{", "}
                <a href="/dynamicvalues">Dynamic Values</a>{", "}
                <a href="/groups">Groups</a>{", "}
                <a href="/customerrors">Custom Errors</a>{", "}
                <a href="/typecasting">Typecasting</a>{", "}
                <a href="/wysiwyg">WYSIWYG Editor</a>
            </Paragraph>
            <Heading>Collections</Heading>
            <Paragraph>
                <a href="/collections">Collections</a>{", "}
                <a href="/collectionrules">Collection Rules</a>
            </Paragraph>
            <Heading>Wizard</Heading>
            <Paragraph>
                <a href="/wizard">Simple Wizard</a>{", "}
                <a href="/dynamicsteps">Dynamic Steps</a>{", "}
                <a href="/stepsummaries">Step Summaries</a>{", "}
                <a href="/wizardnavigation">Wizard Navigation</a>
            </Paragraph>
            <Heading>Various</Heading>
            <Paragraph>
                <a href="/slideshow">Slideshow</a>{", "}
                <a href="/quiz">Quiz</a>{", "}
                <a href="/sparouter">SPA Router</a>
            </Paragraph>
        </Layout>
    );
};
  
export default FormPage;