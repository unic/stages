import { toUid, type JsonObject, type StudioFieldNode, type StudioNode, type StudioProjectDocument, type StudioValidatorSpec, type Uid } from "../../src/document";
import type { StudioExpression } from "../../src/expressions/types";
import type { StudioFieldKey, StudioWidth } from "../../src/registry";

const uid = (id: string) => toUid(`kitchen_${id}`);
const literal = (value: boolean | number | string): StudioExpression => ({ kind: "literal", value });
const ref = (...path: string[]): StudioExpression => ({ kind: "reference", scope: "value", path });
const equals = (left: StudioExpression, value: boolean | string): StudioExpression => ({ kind: "binary", operator: "===", left, right: literal(value) });
const required = (message: string): StudioValidatorSpec => ({ kind: "required", on: ["input", "submit"], revealOn: ["blur", "submit"], message });
const layout = (desktop: StudioWidth = "half", tablet: StudioWidth = "half"): JsonObject => ({
  layout: { width: { mobile: "full", tablet, desktop }, columns: { mobile: 1, tablet: 1, desktop: 1 }, align: { mobile: "stretch", tablet: "stretch", desktop: "stretch" } },
});

/** A self-contained authoring playground; all behavior is stored in the document. */
function createKitchensink(): StudioProjectDocument {
  const nodes: Record<Uid, StudioNode> = {};
  const add = <T extends StudioNode>(node: T): Uid => { nodes[node.uid] = node; return node.uid; };
  const field = (id: string, label: string, key: StudioFieldKey = "text", props: JsonObject = {}, extra: Partial<StudioFieldNode> = {}): Uid => add({
    uid: uid(id), kind: "field", runtimeId: id.split("_").at(-1)!, definition: { key, version: 1 },
    props: { label, ...props }, presentation: layout(), ...extra,
  });
  const content = (id: string, key: string, text: string, props: JsonObject = {}): Uid => add({
    uid: uid(id), kind: "block", definition: { key: `block:${key}`, version: 1 }, props: { text, ...props }, presentation: layout("full", "full"),
  });
  const section = (id: string, title: string, help: string, children: readonly Uid[]): Uid => add({
    uid: uid(id), kind: "group", runtimeId: id, presentation: { label: title, ...layout("full", "full") },
    childUids: [content(`${id}_heading`, "heading", title, { level: "2" }), content(`${id}_help`, "help", help), ...children],
  });

  const controls = section("controls", "1. Switch things on and off", "Switch to Business to reveal company details. Enable delivery or advanced options to reveal more fields. Lock contact details to test inherited disabled state.", [
    field("controls_mode", "Account type", "choice", { options: "Personal\nBusiness" }),
    field("controls_delivery", "Use a separate delivery address", "checkbox"),
    field("controls_advanced", "Show advanced options", "checkbox"),
    field("controls_locked", "Lock contact details", "checkbox"),
  ]);
  const profile = section("profile", "2. Every field type", "Try editing, blurring, and submitting fields. Switch device sizes to compare widths. Email and website use explicit pattern validation; a password needs at least eight characters.", [
    field("profile_name", "Full name", "text", { placeholder: "Ada Lovelace" }, { validators: [required("Enter your name.")] }),
    field("profile_email", "Email", "email", {}, { validators: [required("Enter an email."), { kind: "pattern", pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", on: ["blur", "submit"], message: "Use an email such as ada@example.com." }] }),
    field("profile_phone", "Phone", "tel", { placeholder: "+41 44 555 01 23" }),
    field("profile_website", "Website", "url", {}, { validators: [{ kind: "pattern", pattern: "^https?://.+", on: ["blur", "submit"], message: "Start the website with http:// or https://." }] }),
    field("profile_password", "Demo password", "password", { helpText: "Use a made-up value for testing." }, { validators: [{ kind: "length", min: 8, on: ["blur", "submit"], message: "Use at least eight characters." }] }),
    field("profile_confirm", "Repeat demo password", "password", {}, { validators: [{ kind: "comparison", operator: "===", other: ref("profile", "password"), dependencies: [["profile", "password"]], on: ["blur", "submit"], message: "The passwords must match." }] }),
    field("profile_age", "Age", "number", { min: 18, max: 120 }, { validators: [{ kind: "range", min: 18, max: 120, on: ["input", "submit"], message: "Choose an age between 18 and 120." }] }),
    field("profile_date", "Preferred date", "date"),
    field("profile_time", "Preferred time", "time"),
    field("profile_track", "Interest", "choice", { options: "Design\nEngineering\nResearch\nProduct" }),
    field("profile_rating", "Confidence", "range", { min: 0, max: 10, step: 1 }),
    field("profile_updates", "Send me updates", "checkbox"),
    field("profile_notes", "Notes", "textarea", { rows: 3, helpText: "Long text, full-width layout, and a 240-character limit." }, { presentation: layout("full", "full"), validators: [{ kind: "length", max: 240, on: ["blur", "submit"], message: "Keep notes under 240 characters." }] }),
  ]);
  nodes[profile] = { ...nodes[profile]!, behavior: { disabled: ref("controls", "locked") } };
  const company = section("company", "3. Conditional company details", "This entire group follows the Account type switch. Its values remain available when the group is hidden.", [
    field("company_name", "Company name", "text", {}, { validators: [required("Enter a company name.")] }),
    field("company_taxId", "Tax reference", "text", { helpText: "Two uppercase letters followed by six digits." }, { validators: [{ kind: "pattern", pattern: "^[A-Z]{2}[0-9]{6}$", on: ["blur", "submit"], message: "Use a reference like CH123456." }] }),
  ]);
  nodes[company] = { ...nodes[company]!, behavior: { when: equals(ref("controls", "mode"), "Business") } };
  const order = section("order", "4. Transforms, reducers, and calculated values", "Quantity below one is normalized to one on input. A group transform recalculates total when quantity, price, or discount changes. In Preview, the Apply demo discount event runs a field reducer that sets the discount to 10.", [
    field("order_quantity", "Quantity", "number", { step: 1 }, { transforms: [{ id: "quantity.minimum", on: "input", when: { kind: "binary", operator: "<", left: ref("order", "quantity"), right: literal(1) }, actions: [{ op: "set", target: { kind: "event-target" }, value: literal(1) }] }] }),
    field("order_price", "Unit price", "number", { min: 0, step: 0.5 }, { validators: [{ kind: "range", min: 0, max: 10000, on: ["input", "submit"], message: "Price must be between 0 and 10,000." }] }),
    field("order_discount", "Discount", "number", { min: 0, max: 100 }, { reducers: [{ id: "discount.demo", on: "demo:discount", actions: [{ op: "set", target: { kind: "event-target" }, value: { kind: "reference", scope: "event", path: ["payload"] } }] }], validators: [{ kind: "range", min: 0, max: 100, on: ["input", "submit"], message: "Discount must be between 0 and 100." }] }),
    field("order_total", "Calculated total", "number", { helpText: "Quantity × price × (1 − discount / 100)." }, { behavior: { disabled: true } }),
    field("order_reference", "Advanced reference", "text", { helpText: "This field is structurally added or removed by Show advanced options." }, { behavior: { presentWhen: ref("controls", "advanced") } }),
  ]);
  const orderNode = nodes[order];
  if (orderNode?.kind === "group") nodes[order] = { ...orderNode, transforms: [{ id: "order.total", on: ["input", "demo:discount"], actions: [{ op: "set", target: { kind: "node", uid: uid("order_total") }, value: { kind: "binary", operator: "*", left: { kind: "binary", operator: "*", left: ref("order", "quantity"), right: ref("order", "price") }, right: { kind: "binary", operator: "-", left: literal(1), right: { kind: "binary", operator: "/", left: ref("order", "discount"), right: literal(100) } } } }] }] };
  const addressNodes: Record<Uid, StudioNode> = {};
  for (const [id, label] of [["street", "Street"], ["city", "City"], ["postal", "Postal code"], ["country", "Country"]]) {
    const node: StudioFieldNode = { uid: uid(`address_${id}`), kind: "field", runtimeId: id!, definition: { key: "text", version: 1 }, props: { label: label! }, presentation: layout(id === "street" ? "full" : "half"), validators: [required(`Enter ${label!.toLowerCase()}.`)] };
    addressNodes[node.uid] = node;
  }
  const addresses = section("addresses", "5. Linked address fragments", "Billing and delivery share one definition and keep independent values. Edit the Address fragment in Layers to update both. Delivery has its own street label override and follows the delivery switch.", [
    content("billing_heading", "heading", "Billing address", { level: "3" }),
    add({ uid: uid("billing"), kind: "fragment", runtimeId: "billing", fragmentUid: uid("address"), presentation: layout("full", "full") }),
    add({ uid: uid("delivery"), kind: "fragment", runtimeId: "delivery", fragmentUid: uid("address"), presentation: layout("full", "full"), behavior: { when: ref("controls", "delivery") }, overrides: { [uid("address_street")]: { props: { label: "Delivery street" } } } }),
  ]);
  const guests = section("team", "6. Repeatable team members", "Add, remove, duplicate, and reorder rows. Each row owns its name and role. The collection allows one to five members.", [
    add({ uid: uid("members"), kind: "collection", runtimeId: "members", childUids: [field("member_name", "Member name", "text", {}, { validators: [required("Enter the member name.")] }), field("member_role", "Member role", "choice", { options: "Designer\nDeveloper\nReviewer" })], min: 1, max: 5, initialRows: 1, itemKey: { kind: "index" }, validators: [{ kind: "collection", min: 1, max: 5, on: "submit", message: "Add one to five members." }] }),
  ]);
  const textVariant = add({ uid: uid("textVariant"), kind: "variant", runtimeId: "note", childUids: [field("note_text", "Note text", "textarea", { rows: 2 })] });
  const linkVariant = add({ uid: uid("linkVariant"), kind: "variant", runtimeId: "link", childUids: [field("link_title", "Link title"), field("link_url", "Link URL", "url")] });
  const variants = section("resources", "7. Variant rows", "Add a note or a link, then switch a row’s variant to test changing structure and independent row state.", [
    add({ uid: uid("items"), kind: "collection", runtimeId: "items", discriminator: "kind", variantUids: [textVariant, linkVariant], initialVariantUid: textVariant, initialRows: 1, min: 0, max: 6, itemKey: { kind: "index" } }),
  ]);
  const details = add({ uid: uid("detailsStage"), kind: "stage", runtimeId: "details", presentation: { label: "Details" }, childUids: [field("details_title", "Request title", "text", {}, { validators: [required("Enter a request title before continuing.")] }), field("details_priority", "Priority", "choice", { options: "Normal\nHigh\nUrgent" })] });
  const review = add({ uid: uid("reviewStage"), kind: "stage", runtimeId: "review", presentation: { label: "Review" }, childUids: [content("review_message", "message", "Go back to edit your request, or confirm below.", { tone: "success" }), field("review_confirmed", "I reviewed this request", "checkbox", {}, { validators: [required("Confirm your review.")] })] });
  const wizard = section("workflow", "8. A small wizard", "Move through Details and Review. Next validates the current stage. The rest of the playground stays visible outside the wizard.", [
    add({ uid: uid("wizard"), kind: "wizard", runtimeId: "request", stageUids: [details, review], initialStageUid: details, navigation: { nonLinear: false, validateCurrent: true }, presentation: { label: "Request workflow" } }),
  ]);
  const widths = section("layout", "9. Responsive layout lab", "Desktop: quarter, quarter, half, third, two thirds, and full width. Tablet uses halves; mobile stacks everything. Use the canvas S/M/L controls to change one breakpoint.", [
    ...(["quarter", "quarter", "half", "third", "two-thirds", "full"] as const).map((width, index) => field(`layout_sample${index + 1}`, `${width} width`, "text", { placeholder: `Layout sample ${index + 1}` }, { presentation: layout(width) })),
    content("layout_warning", "message", "This is a warning content block. Content blocks do not collect values.", { tone: "warning" }),
    add({ uid: uid("divider"), kind: "block", definition: { key: "block:divider", version: 1 }, props: { label: "End of playground" }, presentation: layout("full", "full") }),
  ]);
  const value: JsonObject = {
    controls: { mode: "Business", delivery: true, advanced: true, locked: false },
    profile: { name: "Ada Lovelace", email: "ada@example.com", phone: "+41 44 555 01 23", website: "https://example.com", password: "demo-only-123", confirm: "demo-only-123", age: 32, date: "2026-10-12", time: "09:30", track: "Engineering", rating: 7, updates: true, notes: "Try all the controls, then switch scenarios in Preview." },
    company: { name: "Example Studio", taxId: "CH123456" }, order: { quantity: 3, price: 25, discount: 0, total: 75, reference: "DEMO-42" },
    addresses: { billing: { street: "10 Example Street", city: "Zurich", postal: "8001", country: "Switzerland" }, delivery: { street: "20 Sample Avenue", city: "Bern", postal: "3000", country: "Switzerland" } },
    team: { members: [{ name: "Ada", role: "Developer" }, { name: "Sam", role: "Designer" }] },
    resources: { items: [{ kind: "note", text: "A plain text resource" }, { kind: "link", title: "Example website", url: "https://example.com" }] },
    workflow: { request: { details: { title: "Explore the Kitchensink", priority: "Normal" }, review: { confirmed: true } } },
    layout: { sample1: "Quarter", sample2: "Quarter", sample3: "Half", sample4: "Third", sample5: "Two thirds", sample6: "Full" },
  };
  return {
    format: "stages-studio", formatVersion: 1,
    project: { uid: uid("project"), title: "Kitchensink", defaultLocale: "en" },
    forms: { [uid("form")]: {
      uid: uid("form"), title: "Kitchensink", runtime: { schemaId: "studio-kitchensink", schemaVersion: 1 },
      rootNodeUids: [content("intro", "heading", "Kitchensink", { level: "2" }), content("intro_help", "message", "A playground for authoring and runtime behavior. Start with the switches below; use Preview for scenarios, validation, events, and row operations.", { tone: "info" }), controls, profile, company, order, addresses, guests, variants, wizard, widths],
      nodes, settings: {},
      events: [{ id: "discount", title: "Apply demo discount", name: "demo:discount", target: { kind: "node", uid: uid("order_discount") }, payload: literal(10), source: "user" }],
      scenarios: [
        { uid: uid("populated"), title: "Business · all features", value },
        { uid: uid("personal"), title: "Personal · fewer fields", value: { ...value, controls: { mode: "Personal", delivery: false, advanced: false, locked: false } } },
        { uid: uid("locked"), title: "Locked contact details", value: { ...value, controls: { mode: "Business", delivery: true, advanced: true, locked: true } } },
        { uid: uid("invalid"), title: "Invalid · submit to see errors", value: { ...value, profile: { ...(value["profile"] as JsonObject), name: "", email: "invalid", password: "short", confirm: "different", age: 12 }, company: { name: "", taxId: "123" }, order: { quantity: 1, price: -5, discount: 150, total: 2.5, reference: "" }, team: { members: [{ name: "", role: "Reviewer" }] } } },
      ],
    } },
    fragments: { [uid("address")]: { uid: uid("address"), title: "Address", version: 1, parameters: [], rootNodeUids: Object.keys(addressNodes) as Uid[], nodes: addressNodes } },
    resources: {},
  };
}

export const STUDIO_KITCHENSINK_PROJECT = createKitchensink();
