import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import "nextra-theme-docs/style.css";

export const metadata = {
  title: {
    default: "Stages Documentation",
    template: "%s – Stages Documentation",
  },
  description: "Stages v1 form and wizard library documentation",
};

const navbar = (
  <Navbar
    logo={<b>Stages Documentation</b>}
    projectLink="https://github.com/unic/stages"
  />
);

const footer = (
  <Footer>MIT {new Date().getFullYear()} © Fredi Bach, Unic AG.</Footer>
);

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          docsRepositoryBase="https://github.com/unic/stages/tree/master/docs"
          footer={footer}
          navbar={navbar}
          pageMap={await getPageMap()}
          sidebar={{ autoCollapse: true }}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
