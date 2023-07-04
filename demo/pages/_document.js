import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <link
            rel="stylesheet"
            href="https://unpkg.com/purecss@2.1.0/build/pure-min.css"
            integrity="sha384-yHIFVG6ClnONEA5yB5DJXfW2/KC173DIQrYoZMEtBvGzmf0PKiGyNEqe9N6BNDBH"
            crossorigin="anonymous"
        />
        <style>{`
            a {
                text-decoration: none;
            }
            a:hover {
                text-decoration: underline;
            }
        `}</style>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}