/** Plain-language help for the authoring UI; kept separate from saved projects. */
interface StudioHelpTopic {
  readonly title: string;
  readonly summary: string;
  readonly fields: readonly (readonly [string, string])[];
}

export const studioHelpTopics: readonly StudioHelpTopic[] = [
  { title: "Getting started", summary: "Build a form by adding questions, arranging them, and trying it out.", fields: [
    ["Design / Inspector", "Select a question on the canvas or in Layers to edit its settings in the Inspector. Select the form in Layers to edit rules for the whole form."],
    ["Design indicators", "In Design, a light grid and outlines show each item’s boundaries. Small badges show configured validation, transforms (including reducers), localization, and logic. Hover or focus a badge for details. They describe settings on that item, not whether an answer is valid. Preview hides these guides."],
    ["Preview / Test details", "Try filling in your form as a visitor would. Test details opens tools for trying sample data, checking rules, and investigating problems. Preview answers are separate from your saved form design."],
    ["Insert", "Add a field for an answer, content for instructions, or a structure for organizing questions. The plus button between canvas items inserts at that position."],
    ["Desktop / Tablet / Mobile", "Try the canvas at different screen widths. Use Responsive layout to change how a selected item fits each size."],
    ["Open demo", "Load a sample form to explore a feature. Save work you want to keep before switching projects."],
    ["Undo / Redo", "Step backward or forward through edits to your form design. These controls do not undo answers entered in Preview."],
  ] },
  { title: "Project & recovery", summary: "Projects are saved locally in this browser. Export a copy to keep a portable backup.", fields: [
    ["Local project / Project title / Rename", "Choose a saved project, or edit its title and confirm the rename. The title helps you recognize it in the project list."],
    ["New / Duplicate", "Start an empty project, or make an independent copy of the current project."],
    ["Save draft", "Save the form design and its scenarios in this browser. The status bar shows whether project changes are saved."],
    ["Reload", "Replace the current project with its saved version. Unsaved edits are discarded after confirmation."],
    ["Delete / Recovery / Restore / Discard", "Delete moves a project to recovery. Restore brings back a recovery copy. Discard removes that recovery copy."],
    ["Legacy project", "Import a project from the older Studio format. Review conversion messages for features that need attention."],
  ] },
  { title: "Layers & fragments", summary: "Layers shows the form as a list, including items nested inside other items.", fields: [
    ["Search layers / Expand / Collapse", "Find items by name and show or hide their children in the list. Collapsing a layer does not hide it from the form."],
    ["Select / Move / Copy / Cut / Paste / Delete", "Select an item to edit it. Drag to rearrange it, or open its context menu for move and clipboard actions. Shift-click adds or removes an item on the canvas; in Layers, Shift selects a range. Command or Control toggles individual items. Right-click a selected item and choose Group to group the selection."],
    ["Group / Ungroup / Convert", "Put selected items in a container, remove that grouping, or change a supported container type. The available actions depend on your selection."],
    ["Create fragment from selection / Insert fragment", "Save a selection as a reusable group. Insert linked copies so shared settings come from one definition."],
    ["Definition name / Definition ID", "The name identifies the reusable group. Read-only IDs keep its data references stable."],
    ["Override label / Detach", "Customize a label for one linked copy. Detach makes that copy independent of the shared definition."],
  ] },
  { title: "Fields & content", summary: "Fields collect answers. Content blocks provide headings and instructions without collecting an answer.", fields: [
    ["Text field / Text area", "Use Text field for a short answer and Text area for several lines, such as comments."],
    ["Email / Phone / Website (URL) / Password / Time", "Use a specialized input for an email address, phone number, web address, masked text, or time. Add validation rules when answers must meet a particular format. Masking a password only hides it on screen."],
    ["Number / Slider", "Number accepts a numeric answer. Slider lets someone choose a number by moving a handle."],
    ["Choice / Options", "Offer a list of answers. Add, rename, reorder, or remove options; the option text is also its saved value."],
    ["Checkbox / Date", "Checkbox collects a yes-or-no answer. Date collects a calendar date."],
    ["Label / Label for selected fields", "The question or caption people see. Select several items to edit any field properties they share, plus responsive layout. Mixed means their values differ. Apply updates only that property for all selected items; Undo reverts the whole batch."],
    ["Help text", "Instructions shown alongside the question. For example: ‘Use the email address where you want your confirmation.’"],
    ["Placeholder", "An example shown inside an empty input. It disappears when someone types, so put essential instructions in Help text."],
    ["Rows", "The visible height of a Text area, measured in lines. This does not limit the length of the answer."],
    ["Minimum / Maximum / Step", "Set the input’s lower bound, upper bound, and increment. For example, a step of 5 offers increments of five. Validation rules provide form-level checks and messages."],
    ["Earliest date / Latest date", "Limit the calendar range using dates such as 2026-09-05 (year-month-day)."],
    ["Runtime ID", "The stable name used to find this item’s answer in data and rules. It is read-only; changing a visible label does not rename it."],
    ["Heading / Level", "Add a section title. Level 2 is a main heading; levels 3 and 4 are nested subheadings."],
    ["Message / Tone", "Add a notice and choose its appearance: information, success, warning, or error. This is display content, not a validation rule."],
    ["Divider", "Separate sections visually, with an optional label."],
  ] },
  { title: "Responsive layout", summary: "Choose how the selected item fits on small and large screens.", fields: [
    ["Layout breakpoint", "Choose Desktop, Tablet, or Mobile before editing. Each screen size has its own settings."],
    ["Width", "How much of the available row the item uses. Half lets two half-width items share a row; Full uses the whole row."],
    ["Columns", "How many columns the container uses to arrange its children."],
    ["Alignment", "Place the item at the start, center, or end of its space, or stretch it to fill that space."],
  ] },
  { title: "Collections & wizards", summary: "Organize related questions, repeated entries, or a form with several steps.", fields: [
    ["Group", "Keep related questions together, such as an address."],
    ["Collection / Variant collection / Variant", "A collection repeats a set of questions, such as guests. A variant collection supports different kinds of rows, such as adult and child guests; each variant defines one kind."],
    ["min / max / initialRows", "The smallest and largest allowed number of rows, and how many rows to create initially."],
    ["Item key / Key property", "Choose how to identify each row as it moves. A property key uses a value such as guestId; that value must be unique for every row."],
    ["Discriminator / Initial row variant", "The discriminator is the answer property that identifies the row’s kind. Initial row variant chooses the kind used for starting rows."],
    ["Wizard / Stage / Initial stage", "A wizard divides a form into steps called stages. Initial stage chooses the starting step."],
    ["Allow nonlinear navigation", "Let people jump between stages instead of following them in order."],
    ["Validate current stage before navigation", "Check the current step’s answers before allowing navigation onward."],
    ["Enable synchronous guard", "Add an immediate true-or-false condition that decides whether navigation is allowed."],
    ["Add / Duplicate / Move / Remove row / Replacement JSON", "Try adding, copying, reordering, or removing entries in Preview. Replacement JSON replaces one row’s answer data; it must be a valid JSON object."],
    ["Simulated route", "Try opening a particular wizard step as though following a link, without changing the browser’s address."],
  ] },
  { title: "Logic & behavior", summary: "Make the form respond to answers and other information.", fields: [
    ["Conditional visibility", "Show an item only when its condition is true. For example, show ‘Company name’ when the person chooses a business account."],
    ["Dynamic disabled state", "Prevent editing while a condition is true, such as when a person does not have permission."],
    ["Conditional structure / Dynamic structure", "Include an item in the active form only when its condition is true. This changes which items participate in the form, beyond just their appearance."],
    ["Computed value", "Calculate an answer from other values, such as quantity multiplied by price."],
    ["Derived label", "Build the visible question label from data, such as including the person’s name."],
  ] },
  { title: "Expressions", summary: "An expression is a small recipe that produces a value or a true-or-false answer.", fields: [
    ["Expression / Part", "Literal uses a fixed value; Reference reads existing data; Not / negate reverses a boolean or number; Operation combines two parts; Conditional chooses between two results."],
    ["Value type / Value", "Boolean means true or false, Number means a numeric amount, Text means words, and Null means no value. Value is the fixed answer you want the recipe to return."],
    ["Reference source", "Form value reads answers; Current row reads one repeated entry; Context reads environment information; Extension reads registered extra state; Metadata reads form progress; Event reads the action being handled."],
    ["Reference path", "The address of the value to read, using dots between levels, such as profile.email. Choose a suggestion when available. An empty path reads the whole source."],
    ["Operator", "=== means equal; !== means different; < and > mean less or greater; <= and >= include equality. && means both; || means either; ?? uses a fallback when a value is missing. +, -, *, / and % add, subtract, multiply, divide and find a remainder. ! reverses true and false."],
    ["If / Then / Otherwise", "Test the If condition. Use Then when it is true and Otherwise when it is false."],
  ] },
  { title: "Value processing", summary: "Advanced rules describe how an action proposes changes to answers.", fields: [
    ["Reducer / Transform", "A field reducer handles an incoming action first. Transforms then run from its target toward the form. Use these to adjust values in response to an action."],
    ["Rule ID / Event name", "Give a rule a recognizable ID. Event name chooses the actions that trigger it, such as input; separate several names with commas."],
    ["Predicate", "An optional condition. The rule runs only when the condition is true."],
    ["Patch / Target / Patch value", "A patch is a proposed edit. Set assigns an expression’s result; Remove removes a value. Target chooses the item to edit, or the item that received the event."],
    ["Add patch / Remove patch / Remove transform / Remove reducer", "Build a rule from several edits, remove an edit, or delete the whole rule."],
  ] },
  { title: "Validation", summary: "Check answers and explain what needs fixing. Add a rule, then set its message and limits.", fields: [
    ["Validation rule / Add rule / Remove validator", "Choose a check and add it to the selected field, container, or form. Required checks for an answer; format checks such as Email need a separate Required rule if empty answers are not allowed. Remove validator deletes that check."],
    ["Message", "The explanation shown when a check fails. Say how to fix the answer, for example ‘Enter at least 8 characters.’"],
    ["Minimum / Maximum", "For Length, these count characters. For Range, they bound a number. For Collection, they count rows. An empty limit leaves that side unbounded."],
    ["Operator / Compare with", "Compare the answer with another value or field. For example, use equality to check that two email fields match."],
    ["Unique row property path", "The property that must differ between rows, such as email. A duplicate value fails the check."],
    ["Trusted service name / Service version / Service request", "Identify a check supplied by the application, such as checking availability. Build request from an expression chooses the data sent to it. The trusted environment supplies its connection settings."],
    ["Regular expression / Flags", "An advanced text pattern, such as ^[0-9]+$ for digits only. Flags modify matching; i ignores letter case."],
    ["Stable ID / Issue code", "Stable ID identifies this rule. Issue code is a short name used to recognize the kind of problem in diagnostics."],
    ["Run on events / Reveal on events", "Run controls when a check is evaluated; Reveal controls when its message becomes visible. Use comma-separated event names, such as input or blur."],
    ["Severity / Include disabled owner", "Choose Error or Warning. Include disabled owner lets this check run even when its item is disabled."],
    ["Dependencies (one absolute path per line)", "List other answers this check depends on, using full paths such as profile.email, one per line."],
    ["Conditional applicability / Applies when", "Only apply this check when an expression is true, such as requiring a company name for business accounts."],
  ] },
  { title: "Localization", summary: "Show labels, help, dates, and numbers in the visitor’s language or regional format.", fields: [
    ["Label locale key / Help text locale key", "A name that looks up translated text in the resource catalog, such as messages.email.label. Leave it blank to use the text entered directly on the field."],
    ["Locale-sensitive display", "Show a date or number in the selected locale’s format while keeping its underlying answer in the standard format. Canonical value only shows the standard value."],
    ["Extensions & locales / Resource catalog JSON", "Edit the project’s language resources and registered extensions in structured JSON. Locale entries provide language labels and translated messages. Keep the existing structure when adding translations."],
  ] },
  { title: "Scenario data", summary: "A scenario is a saved set of sample answers and conditions for testing your form.", fields: [
    ["Named scenario / Add scenario / Scenario name", "Choose a sample case, add one, or give it a useful name such as ‘Returning customer’."],
    ["Domain value JSON", "The scenario’s starting answers, written as structured data. For example, {\"email\":\"guest@example.com\"}. Use the field’s Runtime ID as its key."],
    ["Context JSON / Locale (context-owned)", "Information supplied by the surrounding application, such as language or permissions. Locale chooses the language for this scenario. Replacing context replaces the whole object."],
    ["Registered extension values JSON", "Sample values for extra state registered by the application, separate from submitted answers."],
    ["Async service mocks JSON", "Sample responses for service checks so you can test their behavior without depending on a real service."],
  ] },
  { title: "Events & proposals", summary: "An event is an action, such as typing. A proposal is the resulting suggested change to the answers.", fields: [
    ["Named events / Event ID / Title / Event name", "Define a reusable action. ID identifies the definition, Title names it in the interface, and Event name is the name that rules listen for."],
    ["Target / Source / Payload", "Target is the form or item that receives the action. Source records whether it comes from a user, adapter, or system. Payload is optional data carried with the action."],
    ["Named event / Dispatch", "Choose a defined action and send it to the preview to try its rules."],
    ["Proposal owner", "Accept proposals lets suggested changes become the preview’s answers. Reject proposals keeps the previous answers, so you can test how the form behaves when an application declines an edit."],
    ["Last proposal / Transaction", "Inspect the actions and suggested edits from the latest interaction. A suggested edit is not an accepted answer until the owner accepts it."],
  ] },
  { title: "Runtime persistence", summary: "Try saving and recreating a running form, separately from saving its design.", fields: [
    ["Save runtime envelope / Serialized runtime envelope", "Capture accepted answers and the form’s progress information in a structured snapshot. The text area shows that snapshot."],
    ["Recreate preview", "Rebuild the preview using the captured snapshot to test restoring a session. Context, panel selections, browser state, and service fixtures are outside the snapshot."],
  ] },
  { title: "Runtime observability", summary: "Inspect what the form is doing while you test it.", fields: [
    ["Preview state / Revision", "Current means the preview reflects accepted answers. Stale means it is waiting for or reconciling acceptance. Revision numbers help track changes."],
    ["Validation / Active stages / Row keys", "See check results and pending checks, the open wizard steps, and the identities used to follow repeated rows. Duplicate keys need unique values before those rows can work correctly."],
    ["Copy redacted support report", "Copy a diagnostic summary for troubleshooting. Answer values and credentials are omitted."],
  ] },
  { title: "Validation tools", summary: "Run checks in Preview to see how your form responds to sample answers.", fields: [
    ["Validate form / Stage / Validate stage", "Check the whole form, or choose a wizard stage and check just that step."],
    ["Data path / Validate path", "Check a particular answer using its full address, such as profile.email."],
    ["Status / Pending / Visible / Hidden", "Status summarizes the result. Pending means a check is still working. An issue may exist but stay hidden until its reveal event occurs."],
  ] },
  { title: "Problems", summary: "Find issues in your design or running preview and jump to the item that needs attention.", fields: [
    ["Source / Severity / Form / Entity / Group by", "Filter messages by where they came from, their importance, the form, or the affected item. Group by changes how the results are organized. Compiler issues concern building the form; runtime issues occur while it runs."],
  ] },
  { title: "Import & export", summary: "Move a project between browsers or generate files for a developer to use in an application.", fields: [
    ["Studio project JSON / Import", "Paste a complete exported Studio project and import it. JSON is a structured text format with quoted names and values. Review any reported errors before continuing."],
    ["Export project / Download", "Keep a portable copy of your form design and scenarios. Local browser storage is not a portable backup."],
    ["Generated artifact / Artifact source", "Choose one of the generated files and inspect its contents. These files are intended for application integration; a developer can help connect them to your site."],
  ] },
];

export function studioHelpTitle(section: string): string | undefined {
  const title = section.replace(/ \(\d+\)$/, "");
  if (title === "Recovery") return "Project & recovery";
  if (title === "Extensions & locales") return "Localization";
  if (title === "Dynamic structure") return "Logic & behavior";
  return studioHelpTopics.find((topic) => topic.title === title)?.title;
}
