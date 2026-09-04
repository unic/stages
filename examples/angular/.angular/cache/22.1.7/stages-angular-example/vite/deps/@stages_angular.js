import { Bt as computed, Er as ViewContainerRef, In as Input, Wi as setClassMetadata, an as ChangeDetectionStrategy, cn as Component, hc as DestroyRef, la as ɵɵNgOnChangesFeature, qt as untracked, sl as inject, tl as effect, to as ɵɵdefineComponent, xl as signal } from "./core-D2yLGcAz.js";
//#region node_modules/@stages/angular/dist/index.js
function fieldId(field) {
	return `stages-${field.address.map((segment) => {
		const encoded = [...segment.id].map((character) => character.codePointAt(0)?.toString(16) ?? "0").join("_");
		return `${segment.kind}-${segment.id.length}-${encoded}`;
	}).join("-")}`;
}
function findField(nodes, path) {
	for (const node of nodes) if (node.kind === "field") {
		if (node.path.length === path.length && node.path.every((segment, index) => segment === path[index])) return node;
	} else {
		const nested = findField(node.nodes, path);
		if (nested !== void 0) return nested;
	}
}
function findContainer(nodes, path, kind) {
	for (const node of nodes) if (node.kind !== "field") {
		if (node.kind === kind && node.path.length === path.length && node.path.every((segment, index) => segment === path[index])) return node;
		const nested = findContainer(node.nodes, path, kind);
		if (nested !== void 0) return nested;
	}
}
function valueAtPath(value, path) {
	let current = value;
	for (const segment of path) {
		if (current === null || typeof current !== "object") return void 0;
		current = current[segment];
	}
	return current;
}
function stagesSignal(controller, destroyRef = inject(DestroyRef)) {
	const snapshot = signal(controller.getSnapshot(), {
		...ngDevMode ? { debugName: "snapshot" } : 		/* istanbul ignore next */ {},
		equal: Object.is
	});
	const unsubscribe = controller.subscribe(() => snapshot.set(controller.getSnapshot()));
	destroyRef.onDestroy(unsubscribe);
	return snapshot.asReadonly();
}
function injectStages(factory, input) {
	const destroyRef = inject(DestroyRef);
	const controller = factory();
	const snapshot = stagesSignal(controller, destroyRef);
	effect(() => {
		const next = input();
		untracked(() => controller.update(next));
	});
	destroyRef.onDestroy(() => controller.destroy());
	return {
		controller,
		snapshot
	};
}
function fieldSignal(controller, path, destroyRef = inject(DestroyRef)) {
	const snapshot = stagesSignal(controller, destroyRef);
	return computed(() => {
		const field = findField(snapshot().nodes, path);
		if (field === void 0) throw new Error(`Stages field does not exist at ${JSON.stringify(path)}.`);
		return field;
	});
}
function collectionSignal(controller, path, destroyRef = inject(DestroyRef)) {
	const snapshot = stagesSignal(controller, destroyRef);
	return computed(() => {
		const collection = findContainer(snapshot().nodes, path, "collection");
		if (collection === void 0) throw new Error(`Stages collection does not exist at ${JSON.stringify(path)}.`);
		const rows = collection.nodes.filter((node) => node.kind === "row");
		return {
			canAdd: collection.canAdd === true,
			add(value) {
				controller.dispatch({
					name: "collection:add",
					target: {
						kind: "node",
						address: collection.address
					},
					payload: { value },
					source: "adapter"
				});
			},
			items: rows.map((row, index) => ({
				key: row.id,
				index,
				value: valueAtPath(snapshot().value, row.path),
				address: row.address,
				canRemove: collection.canRemove === true,
				canMovePrevious: !collection.state.disabled && index > 0,
				canMoveNext: !collection.state.disabled && index < rows.length - 1,
				fieldPath(field) {
					return [...row.path, field];
				},
				remove() {
					controller.dispatch({
						name: "collection:remove",
						target: {
							kind: "node",
							address: row.address
						},
						source: "adapter"
					});
				},
				moveTo(nextIndex) {
					controller.dispatch({
						name: "collection:move",
						target: {
							kind: "node",
							address: row.address
						},
						payload: { to: nextIndex },
						source: "adapter"
					});
				}
			}))
		};
	});
}
function wizardSignal(controller, path, destroyRef = inject(DestroyRef)) {
	const snapshot = stagesSignal(controller, destroyRef);
	return computed(() => {
		const wizard = findContainer(snapshot().nodes, path, "wizard");
		if (wizard === void 0) throw new Error(`Stages wizard does not exist at ${JSON.stringify(path)}.`);
		const dispatch = (name, payload) => controller.dispatch({
			name,
			target: {
				kind: "node",
				address: wizard.address
			},
			...payload === void 0 ? {} : { payload },
			source: "adapter"
		});
		return {
			activeStage: wizard.activeStage,
			stages: wizard.nodes.filter((stage) => stage.kind === "stage").map((stage) => ({
				id: stage.id,
				path: stage.path,
				address: stage.address,
				active: stage.active === true,
				disabled: stage.state.disabled,
				validation: stage.validation
			})),
			canPrevious: wizard.canPrevious === true,
			canNext: wizard.canNext === true,
			canGo: wizard.canGo === true,
			previous() {
				dispatch("wizard:previous");
			},
			next() {
				dispatch("wizard:next");
			},
			go(stage) {
				dispatch("wizard:go", stage);
			}
		};
	});
}
var StagesFieldComponent = class {
	constructor() {
		this.container = inject(ViewContainerRef);
	}
	ngOnChanges(_changes) {
		this.bind();
	}
	ngOnDestroy() {
		this.unsubscribe?.();
	}
	bind() {
		this.unsubscribe?.();
		this.unsubscribe = this.controller.subscribe(() => this.render());
		this.render();
	}
	render() {
		const field = findField(this.controller.getSnapshot().nodes, this.path);
		if (field === void 0) throw new Error(`Stages field does not exist at ${JSON.stringify(this.path)}.`);
		if (field.view === void 0 || field.view === null) throw new Error(`Stages field view is missing at ${JSON.stringify(this.path)}.`);
		const view = field.view;
		if (this.component === void 0 || this.view !== view) {
			this.container.clear();
			this.component = this.container.createComponent(view);
			this.view = view;
		}
		this.component.setInput("id", this.id ?? fieldId(field));
		this.component.setInput("field", field);
		this.component.setInput("props", field.props);
		this.component.setInput("emit", (name, payload) => this.controller.dispatch({
			name,
			target: {
				kind: "field",
				path: field.path
			},
			...payload === void 0 ? {} : { payload },
			source: "adapter"
		}));
		this.component.changeDetectorRef.detectChanges();
	}
};
StagesFieldComponent.ɵfac = function StagesFieldComponent_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || StagesFieldComponent)();
};
StagesFieldComponent.ɵcmp = /* @__PURE__ */ ɵɵdefineComponent({
	type: StagesFieldComponent,
	selectors: [["stages-field"]],
	inputs: {
		controller: "controller",
		path: "path",
		id: "id"
	},
	features: [ɵɵNgOnChangesFeature],
	decls: 0,
	vars: 0,
	template: function StagesFieldComponent_Template(rf, ctx) {},
	encapsulation: 2
});
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(StagesFieldComponent, [{
		type: Component,
		args: [{
			selector: "stages-field",
			standalone: true,
			template: "",
			changeDetection: ChangeDetectionStrategy.OnPush
		}]
	}], null, {
		controller: [{
			type: Input,
			args: [{ required: true }]
		}],
		path: [{
			type: Input,
			args: [{ required: true }]
		}],
		id: [{ type: Input }]
	});
})();
//#endregion
export { StagesFieldComponent, collectionSignal, fieldSignal, injectStages, stagesSignal, wizardSignal };
