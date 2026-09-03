// @ts-nocheck
import React, { Fragment, useEffect } from "react";
import { isValidElement } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dropdown } from "./primeCompat";
import _ from "lodash";
import EditableBlock from "./EditableBlock";
import InsertBlock from "./InsertBlock";
import GroupContainer from "./GroupContainer";
import StageContainer from "./StageContainer";
import WizardContainer from "./WizardContainer";
import CollectionContainer from "./CollectionContainer";

const SortableRow = ({ id, children, getItemStyle, isFieldConfigEditor }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={getItemStyle(isDragging, {
        transform: CSS.Transform.toString(transform),
        transition,
      }, isFieldConfigEditor)}
    >
      {children}
    </div>
  );
};
import useStagesStore from "./store";
import BlockPathLabel from "./BlockPathLabel";
import { getConfigPathFromDataPath } from "./helpers";

const createKey = (parent, key) => {
  if (!parent) return key;
  return `${parent}.${key}`;
};

export const FieldRenderer = ({
  handleEditCollection,
  handleEditGroup,
  setFormCounter,
  parent,
  setActiveContextMenuInput,
  contextMenuRef,
  isEditMode,
  selectedElement,
  fieldProps,
  fields,
  type,
  isFieldConfigEditor,
  fieldsetId,
}) => {
  const store = useStagesStore();
  useEffect(() => {
    useStagesStore.persist.rehydrate();
  }, []);

  if (typeof fields !== "object" || !typeof window) return null;
  if (!type) type = "field";

  const getListStyle = (isDraggingOver) => ({
    width: "calc(100% - 32px)",
    maxWidth: "calc(100% - 32px)",
    padding: isFieldConfigEditor ? "0px 0 8px 0" : "8px",
  });
  const getItemStyle = (isDragging, draggableStyle, isFieldConfigEditor) => ({
    userSelect: "none",
    width: "calc(100% + 32px)",
    maxWidth: "calc(100% + 32px)",
    margin: isFieldConfigEditor ? "0 0 -16px 0" : "4px 0 8px 0",
    padding: isFieldConfigEditor ? 0 : "4px",
    position: "relative",
    border: isFieldConfigEditor ? "none" : "1px dashed #ddd",
    borderRadius: "3px",
    background: isDragging
      ? "rgba(255, 255, 255, 0.8)"
      : "rgba(255, 255, 255, 0.2)",
    ...draggableStyle,
  });
  const onDragEnd = (key, entries, result) => {
    if (!result.over || result.active.id === result.over.id) return;
    const sourceIndex = entries.indexOf(result.active.id);
    const destinationIndex = entries.indexOf(result.over.id);
    if (sourceIndex < 0 || destinationIndex < 0) return;
    fieldProps.onCollectionAction(key, "move", sourceIndex, destinationIndex);
  };

  const getConfigFromFieldset = (thisPath, fieldsetId) => {
    const fieldset = _.find(store.fieldsets, { id: fieldsetId });
    if (fieldset) {
      const realPath = getConfigPathFromDataPath(thisPath, fieldset.config);
      return _.get(fieldset.config, realPath);
    }
    return {};
  };

  return (
    <>
      <InsertBlock
        isFieldConfigEditor={isFieldConfigEditor}
        fieldsetId={fieldsetId}
        contextMenuRef={contextMenuRef}
        path={createKey(parent, Object.keys(fields)[0])}
        isStage={type === "wizard"}
        direction={type === "group" || type === "stage" ? "column" : "row"}
      />
      {Object.keys(fields).map((key, index) => {
        const field = fields[key];
        const thisPath = createKey(parent, key);
        const fieldConfig = fieldsetId
          ? getConfigFromFieldset(thisPath, fieldsetId)
          : fieldProps.getConfig(thisPath);
        const isFieldset = fieldConfig?.type === "fieldset";
        const thisFieldsetId = isFieldset ? fieldConfig?.fieldset : fieldsetId;
        const width = fieldConfig?.blockWidth
          ? fieldConfig?.blockWidth[store.previewSize] || "large"
          : "large";

        if (isValidElement(field)) {
          if (type === "group") {
            return (
              <Fragment key={thisPath}>
                {index > 0 && (
                  <>
                    <InsertBlock
                      isFieldConfigEditor={isFieldConfigEditor}
                      fieldsetId={thisFieldsetId}
                      contextMenuRef={contextMenuRef}
                      path={thisPath}
                      direction="column"
                    />
                    <InsertBlock
                      isFieldConfigEditor={isFieldConfigEditor}
                      fieldsetId={thisFieldsetId}
                      contextMenuRef={contextMenuRef}
                      path={thisPath}
                      direction="column"
                    />
                  </>
                )}
                <EditableBlock
                  fieldConfig={fieldConfig}
                  width={width}
                  fieldsetId={thisFieldsetId}
                  isFieldConfigEditor={isFieldConfigEditor}
                  key={thisPath}
                  contextMenuRef={contextMenuRef}
                  inGroup
                  field={field}
                  path={thisPath}
                  selectedElement={selectedElement}
                />
              </Fragment>
            );
          }
          return (
            <Fragment key={thisPath}>
              {index > 0 && (
                <InsertBlock
                  isFieldConfigEditor={isFieldConfigEditor}
                  fieldsetId={parent ? thisFieldsetId : undefined}
                  contextMenuRef={contextMenuRef}
                  path={thisPath}
                  direction="row"
                />
              )}
              <EditableBlock
                width={width}
                fieldsetId={thisFieldsetId}
                isFieldConfigEditor={isFieldConfigEditor}
                key={thisPath}
                isFieldset={isFieldset}
                contextMenuRef={contextMenuRef}
                field={field}
                path={thisPath}
                selectedElement={selectedElement}
              />
            </Fragment>
          );
        } else if (typeof field === "object") {
          if (Array.isArray(field)) {
            // collection array
            const collectionConfig = fieldsetId
              ? getConfigFromFieldset(key, fieldsetId)
              : fieldProps.getConfig(key);
            return (
              <Fragment key={thisPath}>
                {index > 0 && (
                  <InsertBlock
                    isFieldConfigEditor={isFieldConfigEditor}
                    fieldsetId={thisFieldsetId}
                    contextMenuRef={contextMenuRef}
                    path={thisPath}
                    direction="row"
                  />
                )}
                <CollectionContainer
                  key={key}
                  isFieldConfigEditor={isFieldConfigEditor}
                  selectedElement={selectedElement}
                  handleEditCollection={handleEditCollection}
                  setFormCounter={setFormCounter}
                  isEditMode={isEditMode}
                  contextMenuRef={contextMenuRef}
                  path={thisPath}
                  label={collectionConfig?.label}
                  secondaryText={collectionConfig?.secondaryText}
                  fieldsetId={thisFieldsetId}
                  inGroup={type === "group"}
                  width={width}
                >
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={(result) => onDragEnd(
                      key,
                      field.map((_, index) => `field-${key}-${index}`),
                      result,
                    )}
                  >
                    <SortableContext
                      items={field.map((_, index) => `field-${key}-${index}`)}
                      strategy={verticalListSortingStrategy}
                    >
                        <div style={getListStyle(false)}>
                          {field.map((entry, index) => (
                            <SortableRow
                              key={`field-${key}-${index}`}
                              id={`field-${key}-${index}`}
                              getItemStyle={getItemStyle}
                              isFieldConfigEditor={isFieldConfigEditor}
                            >
                                  <div
                                    className="flex"
                                    style={{
                                      position: "relative",
                                      flexWrap: "wrap",
                                      padding: isFieldConfigEditor
                                        ? "8px 0"
                                        : "8px 2px",
                                    }}
                                  >
                                    {isEditMode && !isFieldConfigEditor ? (
                                      <BlockPathLabel
                                        onChangeBlockWidth={(width) =>
                                          store.onChangeBlockWidth(
                                            `${thisPath}[${index}]`,
                                            width
                                          )
                                        }
                                        path={`${thisPath}[${index}]`}
                                        inCollection
                                      />
                                    ) : null}
                                    <FieldRenderer
                                      isFieldConfigEditor={isFieldConfigEditor}
                                      handleEditCollection={
                                        handleEditCollection
                                      }
                                      handleEditGroup={handleEditGroup}
                                      parent={`${thisPath}[${index}]`}
                                      setActiveContextMenuInput={
                                        setActiveContextMenuInput
                                      }
                                      contextMenuRef={contextMenuRef}
                                      isEditMode={
                                        isEditMode && !isFieldConfigEditor
                                      }
                                      selectedElement={selectedElement}
                                      fieldProps={fieldProps}
                                      fields={entry}
                                      type="group"
                                      fieldsetId={thisFieldsetId}
                                    />
                                    <div
                                      style={{
                                        position: "absolute",
                                        zIndex: 10,
                                        right: isFieldConfigEditor
                                          ? "2px"
                                          : "8px",
                                        top: isFieldConfigEditor
                                          ? "calc(50% + 2px)"
                                          : "calc(50% - 12px)",
                                      }}
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          fieldProps.onCollectionAction(
                                            key,
                                            "remove",
                                            index
                                          )
                                        }
                                      >
                                        -
                                      </button>
                                    </div>
                                  </div>
                            </SortableRow>
                          ))}
                        </div>
                    </SortableContext>
                  </DndContext>
                  <button
                    type="button"
                    style={{
                      margin: isFieldConfigEditor
                        ? "8px 0 8px 8px"
                        : "-4px 0 8px 8px",
                    }}
                    onClick={() => fieldProps.onCollectionAction(key, "add")}
                  >
                    add row
                  </button>
                </CollectionContainer>
              </Fragment>
            );
          } else {
            const groupConfig = fieldsetId
              ? getConfigFromFieldset(thisPath, fieldsetId)
              : fieldProps.getConfig(thisPath);
            if (groupConfig && groupConfig.type === "wizard") {
              return (
                <Fragment key={thisPath}>
                  {index > 0 && (
                    <InsertBlock
                      isFieldConfigEditor={isFieldConfigEditor}
                      fieldsetId={thisFieldsetId}
                      contextMenuRef={contextMenuRef}
                      path={thisPath}
                      direction="row"
                    />
                  )}
                  <WizardContainer
                    fieldsetId={thisFieldsetId}
                    isFieldConfigEditor={isFieldConfigEditor}
                    selectedElement={selectedElement}
                    handleEditGroup={handleEditGroup}
                    isEditMode={isEditMode}
                    path={thisPath}
                    label={groupConfig?.label}
                    secondaryText={groupConfig?.secondaryText}
                    contextMenuRef={contextMenuRef}
                    fieldProps={fieldProps}
                    inGroup={type === "group"}
                    width={width}
                    key={thisPath}
                  >
                    <FieldRenderer
                      isFieldConfigEditor={isFieldConfigEditor}
                      handleEditCollection={handleEditCollection}
                      handleEditGroup={handleEditGroup}
                      parent={thisPath}
                      setActiveContextMenuInput={setActiveContextMenuInput}
                      contextMenuRef={contextMenuRef}
                      isEditMode={isEditMode && !isFieldConfigEditor}
                      selectedElement={selectedElement}
                      fieldProps={fieldProps}
                      fields={field}
                      type="wizard"
                      fieldsetId={thisFieldsetId}
                    />
                  </WizardContainer>
                </Fragment>
              );
            }
            if (type === "wizard") {
              return (
                <Fragment key={thisPath}>
                  {index > 0 && (
                    <InsertBlock
                      isFieldConfigEditor={isFieldConfigEditor}
                      fieldsetId={thisFieldsetId}
                      contextMenuRef={contextMenuRef}
                      isStage
                      path={thisPath}
                      direction="row"
                    />
                  )}
                  <StageContainer
                    fieldsetId={thisFieldsetId}
                    isFieldConfigEditor={isFieldConfigEditor}
                    selectedElement={selectedElement}
                    handleEditGroup={handleEditGroup}
                    isEditMode={isEditMode}
                    path={thisPath}
                    label={groupConfig?.label}
                    secondaryText={groupConfig?.secondaryText}
                    contextMenuRef={contextMenuRef}
                    key={thisPath}
                  >
                    <FieldRenderer
                      isFieldConfigEditor={isFieldConfigEditor}
                      handleEditCollection={handleEditCollection}
                      handleEditGroup={handleEditGroup}
                      parent={thisPath}
                      setActiveContextMenuInput={setActiveContextMenuInput}
                      contextMenuRef={contextMenuRef}
                      isEditMode={isEditMode && !isFieldConfigEditor}
                      selectedElement={selectedElement}
                      fieldProps={fieldProps}
                      fields={field}
                      type="stage"
                      fieldsetId={thisFieldsetId}
                    />
                  </StageContainer>
                </Fragment>
              );
            }
            return (
              <Fragment key={thisPath}>
                {index > 0 && (
                  <>
                    {parent !== "" && (
                      <InsertBlock
                        isFieldConfigEditor={isFieldConfigEditor}
                        fieldsetId={thisFieldsetId}
                        contextMenuRef={contextMenuRef}
                        path={thisPath}
                        direction="column"
                      />
                    )}
                    <InsertBlock
                      isFieldConfigEditor={isFieldConfigEditor}
                      fieldsetId={thisFieldsetId}
                      contextMenuRef={contextMenuRef}
                      path={thisPath}
                      direction={parent !== "" ? "column" : "row"}
                    />
                  </>
                )}
                <GroupContainer
                  fieldsetId={thisFieldsetId}
                  isFieldConfigEditor={isFieldConfigEditor}
                  selectedElement={selectedElement}
                  handleEditGroup={handleEditGroup}
                  isEditMode={isEditMode}
                  path={thisPath}
                  label={groupConfig?.label}
                  secondaryText={groupConfig?.secondaryText}
                  contextMenuRef={contextMenuRef}
                  inGroup={type === "group"}
                  width={width}
                  border={!!fieldConfig?.blockBorder}
                  key={thisPath}
                >
                  <FieldRenderer
                    isFieldConfigEditor={isFieldConfigEditor}
                    handleEditCollection={handleEditCollection}
                    handleEditGroup={handleEditGroup}
                    parent={thisPath}
                    setActiveContextMenuInput={setActiveContextMenuInput}
                    contextMenuRef={contextMenuRef}
                    isEditMode={isEditMode && !isFieldConfigEditor}
                    selectedElement={selectedElement}
                    fieldProps={fieldProps}
                    fields={field}
                    type={isFieldset ? "fieldset" : "group"}
                    fieldsetId={thisFieldsetId}
                  />
                </GroupContainer>
              </Fragment>
            );
          }
        }
      })}
      <InsertBlock
        isFieldConfigEditor={isFieldConfigEditor}
        fieldsetId={fieldsetId}
        contextMenuRef={contextMenuRef}
        path={
          createKey(
            parent,
            Object.keys(fields)[Object.keys(fields).length - 1]
          ) + "+"
        }
        isStage={type === "wizard"}
        direction={type === "group" || type === "stage" ? "column" : "row"}
      />
      {isFieldConfigEditor && !parent && type !== "fieldset" ? (
        <div style={{ marginLeft: "8px", marginBottom: "32px" }}>
          <br />
          <Dropdown
            options={[
              { label: "Email", value: "email" },
              { label: "Phone", value: "phone" },
              { label: "Regex", value: "regex" },
            ]}
            placeholder="Add validation rule ..."
            onChange={(e) =>
              fieldProps.onCollectionAction("validation", "add", e.target.value)
            }
          />
        </div>
      ) : null}
    </>
  );
};
