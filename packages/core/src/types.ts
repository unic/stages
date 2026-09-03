export type DataPath = readonly (string | number)[];

export type NodeAddressSegment =
  | Readonly<{ kind: "node"; id: string }>
  | Readonly<{ kind: "row"; id: string }>;

export type NodeAddress = readonly NodeAddressSegment[];

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer TItem)[]
    ? readonly DeepReadonly<TItem>[]
    : T extends object
      ? { readonly [TKey in keyof T]: DeepReadonly<T[TKey]> }
      : T;

export interface Diagnostic {
  readonly code: string;
  readonly message: string;
  readonly severity: "error" | "warning";
  readonly path: DataPath;
  readonly address: NodeAddress;
}

export interface DynamicMetaSnapshot {
  readonly revision: number;
  readonly isDirty: boolean;
  readonly touched: readonly NodeAddress[];
  readonly visited: readonly NodeAddress[];
  readonly activeWizards: ReadonlyMap<string, string>;
  readonly extensions: Readonly<Record<string, unknown>>;
}

export interface DynamicConfigContext<TValue, TContext = unknown> {
  readonly value: DeepReadonly<TValue>;
  readonly context: DeepReadonly<TContext>;
  readonly meta: DeepReadonly<DynamicMetaSnapshot>;
}

export interface NodeResolverContext<TValue, TContext = unknown>
  extends DynamicConfigContext<TValue, TContext> {
  readonly path: DataPath;
  readonly address: NodeAddress;
  readonly fieldValue: unknown;
  readonly parentValue: unknown;
}

export type NodePredicate<TValue, TContext = unknown> = (
  context: NodeResolverContext<TValue, TContext>,
) => boolean;

export type DerivedProps<TValue, TContext = unknown> = (
  context: NodeResolverContext<TValue, TContext>,
) => Readonly<Record<string, unknown>>;

export interface StagesEvent<TPayload = unknown> {
  readonly name: string;
  readonly target: StagesEventTarget;
  readonly payload?: TPayload;
  readonly source?: "user" | "adapter" | "system";
}

export type StagesEventTarget =
  | Readonly<{ kind: "field"; path: DataPath }>
  | Readonly<{ kind: "node"; address: NodeAddress }>
  | Readonly<{ kind: "form" }>;

export type StagesPatch =
  | Readonly<{ op: "set"; path: DataPath; value: unknown }>
  | Readonly<{ op: "remove"; path: DataPath }>;

export interface FieldReduceContext<TValue = unknown> {
  readonly value: DeepReadonly<TValue>;
  readonly event: StagesEvent;
  readonly path: DataPath;
}

export type FieldReduceResult<TValue = unknown> =
  | Readonly<{ value: TValue }>
  | Readonly<{ patches: readonly StagesPatch[] }>
  | undefined;

export type FieldEventReducer<TValue = unknown> = (
  context: FieldReduceContext<TValue>,
) => FieldReduceResult<TValue>;

export interface FieldDefinition<TValue = unknown, TProps = Readonly<Record<string, unknown>>, TView = unknown> {
  readonly view: TView;
  readonly initialValue?: TValue | (() => TValue);
  readonly reduce?: FieldEventReducer<TValue>;
  readonly validators?: readonly FieldValidator<TValue, TProps>[];
}

export type FieldRegistry = Readonly<Record<string, FieldDefinition<unknown, unknown, unknown>>>;

export interface FieldValidator<TValue, TProps> {
  readonly id: string;
  readonly validate: (
    value: DeepReadonly<TValue>,
    props: DeepReadonly<TProps>,
  ) => readonly FieldValidationIssue[];
}

export type FieldValidationIssue = Omit<ValidationIssue, "path">;

type DefinitionProps<TDefinition> = TDefinition extends FieldDefinition<infer _TValue, infer TProps, infer _TView>
  ? TProps
  : Readonly<Record<string, unknown>>;

export interface TransformContext<TValue, TContext = unknown>
  extends NodeResolverContext<TValue, TContext> {
  readonly event: StagesEvent;
}

export interface TransformConfig<TValue, TContext = unknown> {
  readonly on: string | readonly string[];
  readonly when?: (context: TransformContext<TValue, TContext>) => boolean;
  readonly apply: (context: TransformContext<TValue, TContext>) => readonly StagesPatch[];
}

export interface FieldInteractionState {
  readonly disabled: boolean;
  readonly focused: boolean;
  readonly touched: boolean;
  readonly visited: boolean;
}

export interface ValidationContext<TValue, TContext = unknown>
  extends NodeResolverContext<TValue, TContext> {
  readonly event: string;
  readonly fieldState: Readonly<FieldInteractionState>;
  readonly signal: ValidationCancellationSignal;
}

export interface ValidationCancellationSignal {
  readonly aborted: boolean;
  onCancel(listener: () => void): () => void;
}

export interface ValidationIssue {
  readonly id: string;
  readonly code: string;
  readonly path: DataPath;
  readonly severity: "error" | "warning";
  readonly message?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface ValidationFailureContext {
  readonly kind: "when" | "validate";
  readonly validatorId: string;
  readonly event: string;
  readonly path: DataPath;
  readonly address: NodeAddress;
  readonly error: unknown;
}

export interface ValidationFailureIssuePresentation {
  readonly code?: string;
  readonly message?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export type ValidationFailureIssueFactory = (
  context: ValidationFailureContext,
) => ValidationFailureIssuePresentation;

export interface ValidatorConfig<TValue, TContext = unknown> {
  readonly id: string;
  readonly on: string | readonly string[];
  readonly revealOn?: string | readonly string[];
  readonly includeDisabled?: boolean;
  readonly when?: (context: ValidationContext<TValue, TContext>) => boolean;
  readonly dependencies?: readonly DataPath[];
  readonly validate: (
    context: ValidationContext<TValue, TContext>,
  ) => readonly ValidationIssue[] | Promise<readonly ValidationIssue[]>;
}

interface NodeBehavior<TValue, TContext> {
  readonly when?: boolean | NodePredicate<TValue, TContext>;
  readonly disabled?: boolean | NodePredicate<TValue, TContext>;
  readonly transforms?: readonly TransformConfig<TValue, TContext>[];
  readonly validators?: readonly ValidatorConfig<TValue, TContext>[];
}

export type FieldNodeConfig<TValue, TFields, TContext = unknown> = {
  readonly [TType in Extract<keyof TFields, string>]: NodeBehavior<TValue, TContext> & {
    readonly kind: "field";
    readonly id: string;
    readonly type: TType;
    readonly props?: DeepReadonly<DefinitionProps<TFields[TType]>>;
    readonly deriveProps?: DerivedProps<TValue, TContext>;
  };
}[Extract<keyof TFields, string>];

export interface GroupNodeConfig<TValue, TFields, TContext = unknown>
  extends NodeBehavior<TValue, TContext> {
  readonly kind: "group";
  readonly id: string;
  readonly nodes: readonly NodeConfig<TValue, TFields, TContext>[];
}

interface CollectionNodeBase<TValue, TContext> extends NodeBehavior<TValue, TContext> {
  readonly kind: "collection";
  readonly id: string;
  readonly min?: number;
  readonly max?: number;
  readonly itemKey?: (item: Readonly<unknown>, index: number) => string;
}

export interface CollectionVariantConfig<TValue, TFields, TContext = unknown> {
  readonly nodes: readonly NodeConfig<TValue, TFields, TContext>[];
}

export type CollectionNodeConfig<TValue, TFields, TContext = unknown> =
  CollectionNodeBase<TValue, TContext> &
    (
      | {
          readonly nodes: readonly NodeConfig<TValue, TFields, TContext>[];
          readonly discriminator?: never;
          readonly variants?: never;
        }
      | {
          readonly nodes?: never;
          readonly discriminator: string;
          readonly variants: Readonly<Record<string, CollectionVariantConfig<TValue, TFields, TContext>>>;
        }
    );

export interface StageNodeConfig<TValue, TFields, TContext = unknown> {
  readonly id: string;
  readonly nodes: readonly NodeConfig<TValue, TFields, TContext>[];
  readonly when?: boolean | NodePredicate<TValue, TContext>;
  readonly disabled?: boolean | NodePredicate<TValue, TContext>;
}

export interface WizardNavigationConfig<TValue> {
  readonly validateCurrent?: boolean;
  readonly nonLinear?: boolean;
  readonly guard?: (value: DeepReadonly<TValue>, from: string, to: string) => boolean;
}

export interface WizardNodeConfig<TValue, TFields, TContext = unknown>
  extends NodeBehavior<TValue, TContext> {
  readonly kind: "wizard";
  readonly id: string;
  readonly stages: readonly StageNodeConfig<TValue, TFields, TContext>[];
  readonly initialStage?: string;
  readonly navigation?: WizardNavigationConfig<TValue>;
}

export type NodeConfig<TValue, TFields, TContext = unknown> =
  | FieldNodeConfig<TValue, TFields, TContext>
  | GroupNodeConfig<TValue, TFields, TContext>
  | CollectionNodeConfig<TValue, TFields, TContext>
  | WizardNodeConfig<TValue, TFields, TContext>;

export interface StagesSchema<TValue, TFields, TContext = unknown> {
  readonly id: string;
  readonly version: number;
  readonly nodes: readonly NodeConfig<TValue, TFields, TContext>[];
  readonly transforms?: readonly TransformConfig<TValue, TContext>[];
  readonly validators?: readonly ValidatorConfig<TValue, TContext>[];
}

export type StagesSchemaFactory<TValue, TFields, TContext = unknown> = (
  context: DynamicConfigContext<TValue, TContext>,
) => StagesSchema<TValue, TFields, TContext>;

export type StagesSchemaInput<TValue, TFields, TContext = unknown> =
  | StagesSchema<TValue, TFields, TContext>
  | StagesSchemaFactory<TValue, TFields, TContext>;

export interface ValidationSnapshot {
  readonly status: "valid" | "invalid" | "pending" | "unknown";
  readonly isValid: boolean;
  readonly issues: readonly ValidationIssue[];
  readonly visibleIssues: readonly ValidationIssue[];
  readonly pendingCount: number;
  readonly unknownCount: number;
}

interface SnapshotState {
  readonly disabled: boolean;
  readonly visible: boolean;
  readonly focused: boolean;
  readonly touched: boolean;
  readonly dirty: boolean;
  readonly validating: boolean;
  readonly issues: readonly ValidationIssue[];
  readonly visibleIssues: readonly ValidationIssue[];
}

export interface FieldSnapshot<TFieldValue = unknown, TView = unknown> {
  readonly kind: "field";
  readonly id: string;
  readonly type: string;
  readonly view: TView;
  readonly path: DataPath;
  readonly address: NodeAddress;
  readonly value: TFieldValue;
  readonly initialValue: TFieldValue;
  readonly props: Readonly<Record<string, unknown>>;
  readonly state: SnapshotState;
}

export interface ContainerSnapshot {
  readonly kind: "group" | "collection" | "wizard" | "stage" | "row";
  readonly id: string;
  readonly path: DataPath;
  readonly address: NodeAddress;
  readonly state: Pick<SnapshotState, "disabled" | "visible">;
  readonly nodes: readonly RenderNodeSnapshot[];
  readonly active?: boolean;
  readonly activeStage?: string;
  readonly visibleStageIds?: readonly string[];
  readonly canPrevious?: boolean;
  readonly canNext?: boolean;
  readonly canGo?: boolean;
  readonly size?: number;
  readonly canAdd?: boolean;
  readonly canRemove?: boolean;
  readonly validation?: ValidationSnapshot;
}

export type RenderNodeSnapshot = FieldSnapshot | ContainerSnapshot;

export interface StagesSnapshot<TValue> {
  readonly value: DeepReadonly<TValue>;
  readonly revision: number;
  readonly nodes: readonly RenderNodeSnapshot[];
  readonly validation: ValidationSnapshot;
  readonly diagnostics: readonly Diagnostic[];
}

export interface StagesChange<TValue> {
  readonly value: TValue;
  readonly previousValue: TValue;
  readonly patches: readonly StagesPatch[];
  readonly events: readonly StagesEvent[];
  readonly source: "user" | "external" | "restore" | "reset";
  readonly transactionId: number;
}

interface StagesCommonOptions<TValue, TFields, TContext> {
  readonly schema: StagesSchemaInput<TValue, TFields, TContext>;
  readonly fields: TFields;
  readonly context?: TContext;
  readonly onChange?: (change: StagesChange<TValue>) => void;
  readonly onDiagnostic?: (diagnostic: Diagnostic) => void;
  readonly validationFailureIssue?: ValidationFailureIssueFactory;
  readonly codec?: StagesValueCodec<TValue>;
  readonly migrations?: readonly StagesStateMigration[];
  readonly extensionCodecs?: Readonly<Record<string, StagesExtensionCodec>>;
  readonly extensions?: Readonly<Record<string, unknown>>;
}

export type StagesOptions<TValue, TFields, TContext = unknown> =
  StagesCommonOptions<TValue, TFields, TContext> &
    (
      | Readonly<{ value: TValue; state?: never }>
      | Readonly<{ value?: never; state: SerializedStagesState }>
    );

export interface StagesUpdate<TValue, TFields, TContext = unknown> {
  readonly value?: TValue;
  readonly context?: TContext;
  readonly schema?: StagesSchemaInput<TValue, TFields, TContext>;
  readonly extensions?: Readonly<Record<string, unknown>>;
}

export interface ValidateOptions {
  readonly scope?: "form" | Readonly<{ path: DataPath }> | Readonly<{ address: NodeAddress }>;
  readonly event?: string;
  readonly reveal?: boolean;
}

export interface SerializedStagesState {
  readonly format: "stages";
  readonly formatVersion: 1;
  readonly schema: Readonly<{ id: string; version: number }>;
  readonly value: JsonValue;
  readonly baseline: JsonValue;
  readonly meta: Readonly<Record<string, JsonValue>>;
}

export interface StagesValueCodec<TValue> {
  readonly encode: (value: DeepReadonly<TValue>) => JsonValue;
  readonly decode: (value: JsonValue) => TValue;
}

export interface StagesExtensionCodec {
  readonly encode: (value: unknown) => JsonValue;
  readonly decode: (value: JsonValue) => unknown;
}

export interface StagesStateMigration {
  readonly schemaId: string;
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly migrate: (state: SerializedStagesState) => SerializedStagesState;
}

export interface StagesController<TValue, TFields = Readonly<Record<string, unknown>>, TContext = unknown> {
  getSnapshot(): StagesSnapshot<TValue>;
  subscribe(listener: () => void): () => void;
  subscribeSelector<TSelection>(
    selector: (snapshot: StagesSnapshot<TValue>) => TSelection,
    listener: (selection: TSelection, previousSelection: TSelection) => void,
    isEqual?: (left: TSelection, right: TSelection) => boolean,
  ): () => void;
  update(input: StagesUpdate<TValue, TFields, TContext>): void;
  dispatch(event: StagesEvent): void;
  batch(run: () => void): void;
  validate(options?: ValidateOptions): Promise<ValidationSnapshot>;
  serialize(): SerializedStagesState;
  destroy(): void;
}
