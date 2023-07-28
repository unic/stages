import {
    AppShell,
    Header,
    Footer,
    Grid,
    Global,
    MantineProvider
} from '@mantine/core';

import Logo from '../components/Logo';
import Card from '../components/Card';
import PageSlogan from '../components/PageSlogan';

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
                <div style={{
                    display: 'flex',
                    alignItems: 'left',
                    justifyContent: "space-between",
                    margin: "64px 48px",
                    maxWidth: "1200px"
                }}>
                    <Logo />
                    <PageSlogan />
                </div>
                <Grid m="64px" gutter="80px">
                    <Grid.Col span={3}>
                        <Card>
                            <h3>ANY LEVEL OF COMPLEXITY</h3>
                            <p>With Stages Studio you can build forms of any complexity. From the simplest non-structured forms to highly complex, dynamic wizards.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Card>
                            <h3>DATA STORAGE OR WEBHOOKS</h3>
                            <p>Store data on our servers and/or use webhooks to store data in your own content management system.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Card>
                            <h3>PUBLISHING WORK-FLOW</h3>
                            <p>Set up editing and approval workflows for your company/client team or leave it simple and publish yourself.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Card>
                            <h3>FORM SPANNING RELATIONSHIPS</h3>
                            <p>Connect multiple forms by defining relationships between them and create a whole application of connected forms.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Card>
                            <h3>LIBRARY OF PRE-MADE VALIDATIONS</h3>
                            <p>Getting validation right can be tricky. Stages Studio has a big library of pre-made validation rules you can combine in your forms.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Card>
                            <h3>EXPORT FORMS TO REACT</h3>
                            <p>If you need more control over styles, validations and storage logic, you can export any form to React and use it in your own project.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Card>
                            <h3>MODULAR BY DESIGN</h3>
                            <p>You can reuse a fields config or a whole fieldset wherever you want, by simply referencing it by its path.</p>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Card>
                            <h3>DYNAMIC TEMPLATE LITERALS</h3>
                            <p>Any type of text, like labels and placeholders or step summaries, can reference any form data and aggregations of it.</p>
                        </Card>
                    </Grid.Col>
                </Grid>
            </div>
        </MantineProvider>
    );
};