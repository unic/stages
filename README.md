# Stages

<img src="https://unpkg.com/react-stages@0.1.17/stages-logo.png" align="right" title="Stages" width="400">

Stages, ultra flexible, super powerful and relatively lightweight (37.2 kb minified and gzipped as of v0.5.6) wizard and form components for React. For devs which miss advanced features like collections and deeply nested data structures from libs like React-Hook-Forms or Formik.

**Stages is currently not production ready! The API will most likely slightly change before v1 release. Use at your own risk. However, we here at Unic already do use it with success in multiple big client projects.**

- [Demos (WIP)](https://stages-demo.vercel.app/)
- [Docs (WIP)](https://stages-docs.vercel.app/)
- [Stages Studio (online form editor, coming soon)](https://stages.studio/)

## Possible Usecases:

- Forms (one stage)
- Wizards (multiple stages, linear progression)
- Dynamic Wizard (multiple dynamic stages, non linear progression)
- Text Adventure (multiple stages, free progression)
- Quiz (One or multiple stages, with custom validation and locked fields)
- Accordion Form (stages rendered inside an accordion)
- Slideshow (multiple stages, no validation, keyboard navigation)
- Router (for SPAs)

## Installation

Installation:

`npm i react-stages --save`

## Component Structure

This is the basic component structure for a wizard:

<img src="https://unpkg.com/react-stages@0.1.19/stages-structure.png" title="Stages Structure" width="100%">
