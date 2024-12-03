import Document, { Html, Head, Main, NextScript } from "next/document";
import * as React from "react";
import { renderStatic } from "../shared/renderer";
export default class AppDocument extends Document {
  static async getInitialProps(ctx) {
    const page = await ctx.renderPage();
    const { css, ids } = await renderStatic(page.html);
    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      styles: (
        <React.Fragment>
          {initialProps.styles}
          <style
            data-emotion={`css ${ids.join(" ")}`}
            dangerouslySetInnerHTML={{ __html: css }}
          />
        </React.Fragment>
      ),
    };
  }

  render() {
    return (
      <Html>
        <Head>
          <title>Stages Studio - Form Management System (FMS)</title>

          <meta
            name="title"
            content="Stages Studio - Form Management System (FMS)"
          />
          <meta
            itemProp="name"
            content="Stages Studio - Form Management System (FMS)"
          />
          <meta
            name="twitter:title"
            content="Stages Studio - Form Management System (FMS)"
          />
          <meta
            property="og:title"
            content="Stages Studio - Form Management System (FMS)"
          />
          <meta
            name="description"
            content="With Stages Studio you can build forms of any complexity. From the simplest non-structured forms to highly complex, dynamic wizards."
          />
          <meta
            itemProp="description"
            content="With Stages Studio you can build forms of any complexity. From the simplest non-structured forms to highly complex, dynamic wizards."
          />
          <meta
            name="twitter:description"
            content="With Stages Studio you can build forms of any complexity. From the simplest non-structured forms to highly complex, dynamic wizards."
          />
          <meta
            property="og:description"
            content="With Stages Studio you can build forms of any complexity. From the simplest non-structured forms to highly complex, dynamic wizards."
          />

          <meta property="og:image" content="/stages-studio-og.png" />

          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />

          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon-16x16.png"
          />

          <link rel="manifest" href="/site.webmanifest"></link>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
