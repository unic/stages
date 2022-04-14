import React from "react";

export default {
    projectLink: 'https://github.com/unic/stages', // GitHub link in the navbar
    github: 'https://github.com/unic/stages', // GitHub link in the navbar
    docsRepositoryBase: 'https://github.com/unic/stages', // base URL for the docs repository
    titleSuffix: 'Stages Documentation',
    nextLinks: true,
    prevLinks: true,
    search: true,
    customSearch: null, // customizable, you can use algolia for example
    darkMode: true,
    footer: true,
    footerText: `© Fredi Bach, Unic AG. `,
    footerEditLink: false,
    logo: (
      <React.Fragment>
        <span className="mr-2 font-extrabold hidden md:inline">Stages</span>
        <span className="text-gray-600 font-normal hidden md:inline">
          Documentation
        </span>
      </React.Fragment>
    ),
    head: (
      <>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Stages Documentation" />
        <meta name="og:title" content="Stages Documentation" />
      </>
    ),
  }