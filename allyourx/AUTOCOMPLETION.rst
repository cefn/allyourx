Overview
========

This intro to the CompletionEditor should help someone build their own domain-specific, DOM-based graphical editor taking advantage of AllyourX schema logic.

The CompletionEditor is an autocompleting raw XML editor which can author data trees conforming to strict schemas (loaded from a RelaxNG file). It creates a page which looks like raw (highlighted) XML, but is actually a HTML DOM which listens to a changing data tree of Thingies and displays it using XML conventions. It's smart enough to be able to keep track of the bindings between DOM elements and the data tree. 

CompletionEditor integrates with OperationCaret to provide editing interactions bound to a schema, steering the document author interactively to establish and maintain validity of the XML document. The OperationCaret needs to be told which ThingyRule corresponds to the Thingy, to understand what are valid children and attributes. In a schema-driven editor, this typically implies that all ancestors and preceding sibling Thingies in the tree have already been matched to rules and validated.

The CompletionEditor can answer the question 'what change to the data tree is intended?' given an event on the DOM. It translates keyboard and mouse events on individual DOM elements  into well-formed edits of the XML document. OperationCaret can answer the query 'what edits are valid here?', where 'here' indicates a place below a focused Thingy in the data tree; either a child position, (an integer), or a property name, (a string).

Carets
======

A caret combines a node in the tree (a Thingy) and a key (an integer or string indicating the edit position). When queried with a caret, the OperationCaret can determine which ThingyOperations can take place at that Caret. Some ThingyOperations are INVOLUNTARY - required for a given caret in order to make the data tree valid, others are VOLUNTARY - optional for that caret. Operations which are non-interactive (fully specified by the schema) can be executed without supervision. Those which are interactive (underspecified by the schema) demand information from the user in order to be fully specified.

Edits
=====

DOM elements are bound to specific caret ranges. The completion editor can detect an event on the DOM and match the event source to a Caret (a node and a key). Where the caret position is a string, the caret corresponds with an individually named attribute. Where the caret key is a non-negative integer, it indicates a child position, (for containers), or a character position, (for content elements). Zero points to the first child or character position. Where the caret position is a negative integer, it indicates a position within the name of a named Thingy. Name characters are sequentially numbered using ascending integers. The last character of the name is in position -1.

Once the Caret match has been established, individual key and mouse events are translated into Operations on the data tree. In a schema-driven scenario, these Operations can then be compared with those proposed by the OperationCaret.

Sets of keystrokes have been defined which are valid in the editing of different parts of an XML document based on the node type and caret position. A key event may be tested against each set depending on its origin. They are defined below using Regular Expressions, although an additional step is required to translate these into keycodes 

Caret Position		Cursor Visual representation	Content	Match	Terminal Matches	Terminal Actions
=================	============================	=============	=====================	=========================
root			In blank document		^$		< 			[new element=>element_name]
element_name		Immediately after <		([A-Za-z]+)	> [] OR \s		[=>element_content 0] OR [new attribute=>attribute_name]
element_content		After > or a child		^$		< OR ::text_content::	[new element=>element_name] OR [new text=>text_content]
attribute_name		One space from element_name	([A-Za-z]+)	=			[=>attribute_value]
attribute_content	Inside inverted commas		[^"]		(">) OR (" ) 		[=>element_content 0] OR [new attribute=>attribute_name]
text_content		Text content between tags	[^<]		[<]			[=>element_content after text child]

Some of these positions do not accept any characters at all. For example, within a root container, or an element container, any text input indicates either that a text node or a child node should be added as elements, and a root node cannot have inherent content of its own, but must contain only a single element.

The routine to implement the editor is therefore for DOM elements to be created matching every part of the data tree, for an individual element to be made contentEditable at a time, and for keyboard and blur events on that element to be handled according to the "Content Match" RegExp (focus stays put) or the "Terminal Match" RegExp (focus leaves) according to the table above. Adding any part of an XML structure causes the entire structure to be introduced. Focus moves to any new element created, and if the departed element doesn't have any content and is invalid in that state, it is deleted.

Deletion
========

If a blur is received at a caret position before it has well-formed content (e.g. an element or attribute with no name) the entire structure is removed. Removing any part of an XML structure (e.g. deleting a structural character such as an inverted comma or an angle bracket) causes the entire structure to be deleted.

Navigation
==========

The navigation keys can be used to move the cursor in the XML document view, but only between user-editable structures. The left key and right key take you to the prev/next position in document order at which content can be added or deleted, skipping over angle brackets, equals signs and inverted commas.

Navigating within a ContentThingy allows steps between a character and its neighbours. The cursor position can be reduced/increased until there are no lower/higher values valid within the name/value of the current Thingy. Before the cursor position moves to a sibling's name/value characters the cursor passes to the position 'between' the starting thingy and its sibling, represented by its own/sibling's caret position, (depending on the direction), before focus moves to its sibling.
