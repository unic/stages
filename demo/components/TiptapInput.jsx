import {
  BubbleMenu,
  EditorContent,
  FloatingMenu,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";
import Head from 'next/head';

const TiptapInput = (
    {
        id,
        label,
        value,
        onChange,
        onBlur,
        onFocus,
        error,
        placeholder,
        isRequired,
        isDisabled,
        prefix,
        suffix,
        secondaryText,
        type,
        errorRenderer,
        ...props // this will give you all other props, things like validateOn, the computedValue function etc. or custom props
    }
) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: `
        <p>
          Try to select <em>this text</em> to see what we call the bubble menu.
        </p>
        <p>
          Neat, isn’t it? Add an empty paragraph to see the floating menu.
        </p>
      `,
  });

  return (
    <>
      <Head>
        <style>{`
            .ProseMirror {
                > * + * {
                  margin-top: 0.75em;
                }
              
                ul,
                ol {
                  padding: 0 1rem;
                }
              }
              
              .bubble-menu {
                display: flex;
                background-color: #0D0D0D;
                padding: 0.2rem;
                border-radius: 0.5rem;
              
                button {
                  border: none;
                  background: none;
                  color: #FFF;
                  font-size: 0.85rem;
                  font-weight: 500;
                  padding: 0 0.2rem;
                  opacity: 0.6;
              
                  &:hover,
                  &.is-active {
                    opacity: 1;
                  }
                }
              }
              
              .floating-menu {
                display: flex;
                background-color: #0D0D0D10;
                padding: 0.2rem;
                border-radius: 0.5rem;
              
                button {
                  border: none;
                  background: none;
                  font-size: 0.85rem;
                  font-weight: 500;
                  padding: 0 0.2rem;
                  opacity: 0.6;
              
                  &:hover,
                  &.is-active {
                    opacity: 1;
                  }
                }
              }
        `}</style>
      </Head>
      {label ? <label htmlFor={id}><h2>{label}{isRequired ? " *" : ""}</h2></label> : null}
      {secondaryText ? <p>{secondaryText}</p> : null}
      <div style={{ border: "1px solid #bbb", borderRadius: "8px", padding: "8px" }}>
        {editor && (
            <BubbleMenu
            className="bubble-menu"
            tippyOptions={{ duration: 100 }}
            editor={editor}
            >
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive("bold") ? "is-active" : ""}
            >
                Bold
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive("italic") ? "is-active" : ""}
            >
                Italic
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive("strike") ? "is-active" : ""}
            >
                Strike
            </button>
            </BubbleMenu>
        )}

        {editor && (
            <FloatingMenu
            className="floating-menu"
            tippyOptions={{ duration: 100 }}
            editor={editor}
            >
            <button
                onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={
                editor.isActive("heading", { level: 1 }) ? "is-active" : ""
                }
            >
                H1
            </button>
            <button
                onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={
                editor.isActive("heading", { level: 2 }) ? "is-active" : ""
                }
            >
                H2
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive("bulletList") ? "is-active" : ""}
            >
                Bullet List
            </button>
            </FloatingMenu>
        )}

        <EditorContent editor={editor} />
      </div>
      {error ? errorRenderer ? errorRenderer(error) : (
        <div style={{ color: "red" }}>Please fill out this field!</div>
      ) : null}
    </>
  );
};

export const isValid = (value, config) => {
    if (config.isRequired && (value === "" || typeof value === "undefined")) return false;
    return true;
};

export default TiptapInput;