import "nextra-theme-docs/style.css";
import "./styles.css";

export const metadata = {
  title: {
    default: "Stages Documentation",
    template: "%s – Stages Documentation",
  },
  description: "Stages v1 form and wizard library documentation",
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>
        <header className="site-header">
          <a className="site-title" href="/">Stages Documentation</a>
          <nav aria-label="Documentation">
            <a href="/installation">Installation</a>
            <a href="/architecture">Architecture</a>
            <a href="/core">Core</a>
            <a href="/react">React</a>
            <a href="/dom">DOM</a>
            <a href="/migration">Migration</a>
            <a href="https://github.com/unic/stages">GitHub</a>
          </nav>
        </header>
        <main className="docs-content">{children}</main>
        <footer className="site-footer">
          MIT {new Date().getFullYear()} © Fredi Bach, Unic AG.
        </footer>
      </body>
    </html>
  );
}
