import type { ContainerSnapshot, RenderNodeSnapshot } from "@stages/core";
import { StagesField, useStagesController } from "@stages/react";
import { ContactList, CheckoutWizard } from "./react-adapter";

type Controller = Parameters<typeof StagesField>[0]["controller"];
type AccountController = Parameters<typeof ContactList>[0]["controller"];

// source:start react-layout-fixed
export function AccountLayout({ controller }: { controller: AccountController }) {
  return <main>
    <section aria-labelledby="profile-heading" className="profile-grid">
      <h2 id="profile-heading">Profile</h2>
      <div className="profile-main">
        <StagesField controller={controller} path={["name"]} />
        <StagesField controller={controller} path={["age"]} />
        <StagesField controller={controller} path={["location"]} />
      </div>
      <aside aria-label="Preferences">
        <StagesField controller={controller} path={["plan"]} />
        <StagesField controller={controller} path={["subscribed"]} />
      </aside>
    </section>
    <ContactList controller={controller} />
    <CheckoutWizard controller={controller} />
  </main>;
}
// source:end react-layout-fixed

// source:start react-layout-tree
type LayoutProps = {
  controller: Controller;
  // Supply complete domain values, unique row keys, and variant discriminators.
  createRow: (collection: ContainerSnapshot) => unknown;
  label: (node: RenderNodeSnapshot) => string;
};

export function DynamicLayout(props: LayoutProps) {
  const snapshot = useStagesController(props.controller);
  return <NodeList {...props} nodes={snapshot.nodes} />;
}

function NodeList({ nodes, ...props }: LayoutProps & {
  nodes: readonly RenderNodeSnapshot[];
}) {
  return <>{nodes.map(node => <LayoutNode
    {...props} key={JSON.stringify(node.address)} node={node}
  />)}</>;
}

function LayoutNode({ node, ...props }: LayoutProps & { node: RenderNodeSnapshot }) {
  const { controller, createRow, label } = props;
  if (node.kind === "field") {
    return <StagesField controller={controller} path={node.path} />;
  }
  if (node.kind === "stage" && !node.active) return null;

  const command = (name: string, target: ContainerSnapshot, payload?: unknown) => {
    controller.dispatch({
      name, target: { kind: "node", address: target.address }, payload, source: "adapter",
    });
  };

  if (node.kind === "collection") {
    const rows = node.nodes.filter((child): child is ContainerSnapshot => child.kind === "row");
    return <fieldset disabled={node.state.disabled}>
      <legend>{label(node)}</legend>
      {rows.map((row, index) => <fieldset key={JSON.stringify(row.address)}>
        <legend>{label(row)}</legend>
        <NodeList {...props} nodes={row.nodes} />
        <button type="button" disabled={!node.canRemove}
          onClick={() => command("collection:remove", row)}>Remove row</button>
        <button type="button" disabled={index === 0}
          onClick={() => command("collection:move", row, { to: Number(row.path.at(-1)) - 1 })}>
          Move up
        </button>
      </fieldset>)}
      <button type="button" disabled={!node.canAdd}
        onClick={() => command("collection:add", node, { value: createRow(node) })}>
        Add row
      </button>
    </fieldset>;
  }

  if (node.kind === "wizard") {
    const stages = node.nodes.filter((child): child is ContainerSnapshot => child.kind === "stage");
    return <fieldset disabled={node.state.disabled}>
      <legend>{label(node)}</legend>
      <ol>{stages.map(stage => <li key={JSON.stringify(stage.address)}>
        <button type="button" aria-current={stage.active ? "step" : undefined}
          disabled={!node.canGo || stage.state.disabled}
          onClick={() => command("wizard:go", node, { stage: stage.id })}>
          {label(stage)}
        </button>
      </li>)}</ol>
      <NodeList {...props} nodes={stages.filter(stage => stage.active)} />
      <button type="button" disabled={!node.canPrevious}
        onClick={() => command("wizard:previous", node)}>Previous</button>
      <button type="button" disabled={!node.canNext}
        onClick={() => command("wizard:next", node)}>Next</button>
    </fieldset>;
  }

  return <fieldset disabled={node.state.disabled}>
    <legend>{label(node)}</legend>
    <NodeList {...props} nodes={node.nodes} />
  </fieldset>;
}
// source:end react-layout-tree
