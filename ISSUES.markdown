Editor Errors
-------------

Everywhere
...selections not possible
	...range operations such as shift-select mouse click or mouse drag not handled (e.g. https://developer.mozilla.org/En/DOM:range)
	...CTRL accelerations and SHIFT selection should be considered
...caret reference is not monitored for deletion to ensure tidyup if the currently focused item is removed from the thingytree
...cursor location has ambiguous mapping to element keys versus leftmost_attribute or text keys. 
	...Assert priority in navigation behaviour
	...Possibly use caret position to indicate selection of entire attribute or element to be deleted
   left arrow at zero character moves to ambiguous parent location - is hysteresis (asymmetry) in reversed sequence a good idea?
...write unit tests for mouse navigation
...mouse navigation doesn't work if cursor placed between editable ranges
...introduce verification/validation step to intervene when caret changes, leaving element with zero-length name, attribute with zero-length name, text node with zero length and so on
...can navigate to invalid caret by moving beyond last character of root container
...ensure that deleting zeroth character of element/attribute/text deletes element/attribute/text
...find out why mouse-clicking in elements doesn't set cursorthingy and cursorkey in editor.html, but keyboard navigation does 

Firefox
...when empty root node is loaded, cursor does not appear and document is invisible (zero height). Could be fixed in CSS? Workaround has been added in editor.html for the time being to move the cursor to inside the first child (with additional content, Firefox is then happy to render the cursor).


Within Containers
...containers (not just elements) should support text handler triggered on < - e.g. root container
...cursor behaviour for after document node should be settled (or this position eliminated)

Between attributes
...cannot create new attribute at cursor position (last-defined attribute ends up at end position)

Within names
...blank names can end up being preserved, should they be impossible?
...no obvious way to remove a named entity with cursor inside name (typical user experience from mistaken entity creation)

Within element name 
...self closing - fundamentally a serialisation/view question as empty tags and self-closed tags are identical in the infoset
	...elements with caret OR children should be shown as open
	...elements without caret AND without children should be shown as closed 
	...need to define interactive mechanism for controlling switch between self-closing or paired tags
		propagate change to self-closing tag up to RecursiveView?
		editors should expand by deleting [/] or overtyping with [>] or using right arrow to move between / and >
		this should create zero-length text node as child (no extra cursor positions required) 
		in memory representation could be zero-length text node?
		need caret representation for trailing position?
		where is xclose tag placed - does it hold the /  

Within element descendants
...insertion of new element between element descendants seems to happen at end, not at cursor position
...cursor flashing after last child seems more intuitive, rather than before next child

Design questions
...what support should exist for xml prolog or multiple elements, text before prolog and multiple top level elements currently allowed (valid relaxNG?) 
...should css 'tree' block layout of elements be optional, to permit people to view/edit the actual newline and tab (multiple &nbsp;) characters?
...should deleting the zeroth character of a name select the descendant range for deletion, an acceleration which indicates deletion of tree about to happen?
...should multiple range markers be used to indicate proposed changes arising from an atomic insertion or deletion which requires corresponding content for validity

Possible names
...stupeditor (0 hits on google)
