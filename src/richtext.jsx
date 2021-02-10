import React, { useCallback, useMemo, useState } from "react";
import isHotkey from "is-hotkey";
import { Editable, withReact, useSlate, Slate } from "slate-react";
import {
	Editor,
	Transforms,
	createEditor,
	Element as SlateElement,
} from "slate";
import { withHistory } from "slate-history";

import { Button, Icon, Toolbar } from "./components";

import {
	MdFormatBold,
	MdFormatItalic,
	MdFormatUnderlined,
	MdLooksOne,
	MdLooksTwo,
	MdFormatQuote,
	MdFormatListNumbered,
	MdFormatListBulleted,
	MdCropFree,
	MdCode,
} from "react-icons/md";

const HOTKEYS = {
	"mod+b": "bold",
	"mod+i": "italic",
	"mod+u": "underline",
};

const LIST_TYPES = ["numbered-list", "bulleted-list"];

const RichTextExample = () => {
	const [value, setValue] = useState(initialValue);
	const renderElement = useCallback((props) => <Element {...props} />, []);
	const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
	const editor = useMemo(() => withHistory(withReact(createEditor())), []);

	return (
		<Slate editor={editor} value={value} onChange={(value) => setValue(value)}>
			<Toolbar>
				<MarkButton format="bold" icon={<MdFormatBold size="24" />} />
				<MarkButton format="italic" icon={<MdFormatItalic size="24" />} />
				<MarkButton
					format="underline"
					icon={<MdFormatUnderlined size="24" />}
				/>
				<BlockButton format="heading-one" icon={<MdLooksOne size="24" />} />
				<BlockButton format="heading-two" icon={<MdLooksTwo size="24" />} />
				<BlockButton format="block-quote" icon={<MdFormatQuote size="24" />} />
				<BlockButton
					format="numbered-list"
					icon={<MdFormatListNumbered size="24" />}
				/>
				<BlockButton
					format="bulleted-list"
					icon={<MdFormatListBulleted size="24" />}
				/>
				<MarkButton format="input" icon={<MdCropFree size="24" />} />
				<BlockButton format="edit-text" icon={<MdCode size="24" />} />
			</Toolbar>
			<Editable
				renderElement={renderElement}
				renderLeaf={renderLeaf}
				placeholder="Enter some rich text…"
				spellCheck
				autoFocus
				onKeyDown={(event) => {
					for (const hotkey in HOTKEYS) {
						if (isHotkey(hotkey, event)) {
							event.preventDefault();
							const mark = HOTKEYS[hotkey];
							toggleMark(editor, mark);
						}
					}
				}}
			/>
		</Slate>
	);
};

const toggleBlock = (editor, format) => {
	const isActive = isBlockActive(editor, format);
	const isList = LIST_TYPES.includes(format);

	Transforms.unwrapNodes(editor, {
		match: (n) =>
			LIST_TYPES.includes(
				!Editor.isEditor(n) && SlateElement.isElement(n) && n.type
			),
		split: true,
	});
	const newProperties = {
		type: isActive ? "paragraph" : isList ? "list-item" : format,
	};
	Transforms.setNodes(editor, newProperties);

	if (!isActive && isList) {
		const block = { type: format, children: [] };
		Transforms.wrapNodes(editor, block);
	}
};

const toggleMark = (editor, format) => {
	const isActive = isMarkActive(editor, format);

	if (isActive) {
		Editor.removeMark(editor, format);
	} else {
		Editor.addMark(editor, format, true);
	}
};

const isBlockActive = (editor, format) => {
	const [match] = Editor.nodes(editor, {
		match: (n) =>
			!Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
	});

	return !!match;
};

const isMarkActive = (editor, format) => {
	const marks = Editor.marks(editor);
	return marks ? marks[format] === true : false;
};

const Element = ({ attributes, children, element }) => {
	switch (element.type) {
		case "block-quote":
			return <blockquote {...attributes}>{children}</blockquote>;
		case "bulleted-list":
			return <ul {...attributes}>{children}</ul>;
		case "heading-one":
			return <h1 {...attributes}>{children}</h1>;
		case "heading-two":
			return <h2 {...attributes}>{children}</h2>;
		case "list-item":
			return <li {...attributes}>{children}</li>;
		case "numbered-list":
			return <ol {...attributes}>{children}</ol>;
		case "edit-text":
			return (<span contentEditable={false}>
				<textarea contentEditable={false}
					style={{
						userSelect: "none",
						color: "gray",
						backgroundColor: "lightyellow",
						border: "1px solid black",
						paddingTop: "4px",
						paddingBottom: "80px",
						marginRight: "10px",
						marginLeft: "10px",
						minHeight: "300px",
						minWidth: "500px"
					}}
				/>
				<span contentEditable={true}  {...attributes}>{children}</span>
				</span>
			);
		default:
			return <p {...attributes}>{children}</p>;
	}
};

const Leaf = ({ attributes, children, leaf }) => {
	if (leaf.bold) {
		children = <strong>{children}</strong>;
	}

	if (leaf.italic) {
		children = <em>{children}</em>;
	}

	if (leaf.underline) {
		children = <u>{children}</u>;
	}

	if (leaf.input) {
		children = (
			<span
				style={{
					color: "gray",
					backgroundColor: "lightyellow",
					border: "1px solid black",
					paddingRight: "10px",
					paddingLeft: "10px",
					marginRight: "10px",
					marginLeft: "10px",
				}}
			>
				{children}
			</span>
		);
	}

	return <span {...attributes}>{children}</span>;
};

const BlockButton = ({ format, icon }) => {
	const editor = useSlate();
	return (
		<Button
			active={isBlockActive(editor, format)}
			onMouseDown={(event) => {
				event.preventDefault();
				toggleBlock(editor, format);
			}}
		>
			<Icon>{icon}</Icon>
		</Button>
	);
};

const MarkButton = ({ format, icon }) => {
	const editor = useSlate();
	return (
		<Button
			active={isMarkActive(editor, format)}
			onMouseDown={(event) => {
				event.preventDefault();
				toggleMark(editor, format);
			}}
		>
			<Icon>{icon}</Icon>
		</Button>
	);
};

const initialValue = [
	{
		type: "paragraph",
		children: [
			{ text: "This is editable " },
			{ text: "rich", bold: true },
			{ text: " text, " },
			{ text: "much", italic: true },
			{ text: " better than a " },
			{ text: "<textarea>", input: true },
			{ text: "!" },
		],
	},
	{
		type: "paragraph",
		children: [
			{
				text:
					"Since it's rich text, you can do things like turn a selection of text ",
			},
			{ text: "bold", bold: true },
			{
				text:
					", or add a semantically rendered block quote in the middle of the page, like this:",
			},
		],
	},
	{
		type: "block-quote",
		children: [{ text: "A wise quote." }],
	},
	{
		type: "paragraph",
		children: [{ text: "Try it out for yourself!" }],
	},
];

export default RichTextExample;
