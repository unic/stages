import Head from "next/head";

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
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </Head>
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
            <AppShell
                styles={{
                    main: {
                        background: "#fff",
                    },
                }}
                footer={
                    <Footer height={60} p="32px 48px" withBorder={false}>
                        (c) Fredi Bach @ Unic
                    </Footer>
                }
                header={
                    <Header height={{ base: 180, md: 180 }} p="32px 48px" withBorder={false}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'left',
                            justifyContent: "space-between",
                            height: '100%',
                            maxWidth: "1000px"
                        }}>
                            <Logo />
                            <PageSlogan />
                        </div>
                    </Header>
                }
            >
                <div style={{ maxWidth: "1100px", marginTop: "-32px" }}>
                    <Grid m="48px" gutter="64px">
                        <Grid.Col span={4}>
                            <Card>
                                <h3>ANY LEVEL OF COMPLEXITY</h3>
                                <p>With Stages Studio you can build forms of any complexity. From the simplest non-structured forms to highly complex, dynamic wizards.</p>
                            </Card>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Card>
                                <h3>DATA STORAGE OR WEBHOOKS</h3>
                                <p>Store data on our servers and/or use webhooks to store data in your own content management system.</p>
                            </Card>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Card>
                                <h3>PUBLISHING WORK-FLOW</h3>
                                <p>Set up editing and approval workflows for your company/client team or leave it simple and publish yourself.</p>
                            </Card>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Card>
                                <h3>FORM SPANNING RELATIONSHIPS</h3>
                                <p>Connect multiple forms by defining relationships between them and create a whole application of connected forms.</p>
                            </Card>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Card>
                                <h3>LIBRARY OF PRE-MADE VALIDATIONS</h3>
                                <p>Getting validation right can be tricky. Stages Studio has a big library of pre-made validation rules you can combine in your forms.</p>
                            </Card>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Card>
                                <h3>EXPORT FORMS TO REACT</h3>
                                <p>If you need more control over styles, validations and storage logic, you can export any form to React and use it in your own project.</p>
                            </Card>
                        </Grid.Col>
                    </Grid>
                </div>
            </AppShell>
        </MantineProvider>
    );
};