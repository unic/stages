import {
    Grid,
    Global,
    MantineProvider
} from '@mantine/core';
import styled from "@emotion/styled";

import Logo from '../components/Logo';
import Card from '../components/Card';
import PageSlogan from '../components/PageSlogan';

const Header = styled.div`
    display: flex;
    align-items: left;
    justify-content: space-between;
    margin: 64px 48px;
    max-width: 1200px;
    flex-direction: column;
    gap: 32px;

    @media screen and (min-width: 960px) {
        flex-direction: row;
        gap: 0;
    }

    @media screen and (max-width: 767px) {
        svg {
            width: 100%;
        }
    }
`;

export default function Page() {
    return (
        <MantineProvider withNormalizeCSS>
            <Global
                styles={() => ({
                    "*, *::before, *::after": {
                        boxSizing: 'border-box',
                    },
                    "body": {
                        "font-family": "'Inter', sans-serif"
                    }
                })}
            />
            <div>
                <Header>
                    <Logo />
                    <PageSlogan />
                </Header>
                <Grid m={{ base: "12px", sm: "64px" }} gutter="80px">
                    <Grid.Col xs={12} sm={6} lg={4} xl={3}>
                        <Card>
                            <h3>ANY LEVEL OF COMPLEXITY</h3>
                            <p>With Stages Studio you can build forms of any complexity. From the simplest non-structured forms to highly complex, dynamic wizards.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col xs={12} sm={6} lg={4} xl={3}>
                        <Card>
                            <h3>DATA STORAGE OR WEBHOOKS</h3>
                            <p>Store data on our servers and/or use webhooks to store data in your own content management system.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col xs={12} sm={6} lg={4} xl={3}>
                        <Card>
                            <h3>PUBLISHING WORK-FLOW</h3>
                            <p>Set up editing and approval workflows for your company/client team or leave it simple and publish yourself.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col xs={12} sm={6} lg={4} xl={3}>
                        <Card>
                            <h3>FORM SPANNING RELATIONSHIPS</h3>
                            <p>Connect multiple forms by defining relationships between them and create a whole application of connected forms.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col xs={12} sm={6} lg={4} xl={3}>
                        <Card>
                            <h3>LIBRARY OF PRE-MADE VALIDATIONS</h3>
                            <p>Getting validation right can be tricky. Stages Studio has a big library of pre-made validation rules you can combine in your forms.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col xs={12} sm={6} lg={4} xl={3}>
                        <Card>
                            <h3>EXPORT FORMS TO REACT</h3>
                            <p>If you need more control over styles, validations and storage logic, you can export any form to React and use it in your own project.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col xs={12} sm={6} lg={4} xl={3}>
                        <Card>
                            <h3>MODULAR BY DESIGN</h3>
                            <p>You can reuse a fields config or a whole fieldset wherever you want, by simply referencing it by its path.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col xs={12} sm={6} lg={4} xl={3}>
                        <Card>
                            <h3>DYNAMIC TEMPLATE LITERALS</h3>
                            <p>Any type of text, like labels and placeholders or step summaries, can reference any form data and aggregations of it.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col xs={12} sm={6} lg={4} xl={3}>
                        <Card>
                            <h3>VISUAL EDITING</h3>
                            <p>Inspired by Figma, Stages Studio has a visual editor where you can directly click on a field to edit it, or drag and drop a field to a new location.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col xs={12} sm={6} lg={4} xl={3}>
                        <Card>
                            <h3>PROFESSIONAL FEATURES</h3>
                            <p>Professional features like Undo/Redo, Interface State, Internationalisation, Autosaving etc. can be activated on any form.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col xs={12} sm={6} lg={4} xl={3}>
                        <Card>
                            <h3>ACCESSIBILITY</h3>
                            <p>Stages Studio is built with accessibility in mind. It is designed to be as accessible as possible without compromising on features.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col xs={12} sm={6} lg={4} xl={3}>
                        <Card>
                            <h3>THEMING</h3>
                            <p>Every part of a Form can be themed. You can choose from a wide range of themes or create your own. And when exported to React, no limits are placed on what you can do.</p>
                        </Card>
                    </Grid.Col>
                </Grid>
            </div>
        </MantineProvider>
    );
};