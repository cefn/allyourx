Editor Errors
-------------

Everywhere
...backspace and delete should only delete when following... or preceding... caret are within the same range (same node and field)
...range operations such as shift-select mouse click or mouse drag not handled (e.g. https://developer.mozilla.org/En/DOM:range)
...CTRL accelerations and SHIFT selection should be considered
...caret reference is not monitored for deletion to ensure tidyup if the currently focused item is removed from the thingytree
...cursor location has ambiguous mapping to element keys versus leftmost attribute/text keys. Assert priority in navigation behaviour
...left arrow at zero character moves to ambiguous parent location - is hysteresis (asymmetry) in reversed sequence a good idea?
...write unit tests for mouse navigation
...mouse navigation doesn't work if cursor placed between editable ranges

Between attributes
...cannot create new attribute at cursor position (last-defined attribute ends up at end position)

Within text
...deleting last character doesn't remove text thingy
...inserting [<] doesn't trigger sibling element creation

Within names
...deleting zeroth character of element/attribute doesn't delete element/attribute
...blank names can end up being preserved, should they be impossible?

Within element name 
...cannot navigate to first attribute using right arrow
...cannot self-close, editors should expand by deleting [/] or overtyping with [>]?
...view switch not just based on in-memory thingy tree, but also on editor caret, else cannot position caret to create children in empty element
...could make paired tags appear by inserting zero-length text in memory, separate question from serialisation choices (self-closing where empty)  
...empty elements aren't automatically self-closed
...no mechanism for controlling switch between self-closing or paired tags
...question - what is caret position to permit deleting trailing slash of self-closing tag?

Within element descendants
...left arrow after element sibling of text thingy moves cursor into text thingy instead of element thingy
...insertion of new element seems to happen at end, not at cursor position within descendants
...cannot yet exit an element or text child by typing[>]
...text node creation routine is triggered even when text node exists
...can become trapped with a descendant key of zero without the ability to move forward or backward
...cursor flashing after last child, rather than before next child, seems more intuitive

Design questions
...should change to self-closing tag be propagated up to RecursiveView?
...monitor cursor location changes for round-tripping between DOM and ThingyTree? 
...what support should exist for xml prolog or multiple elements, text before prolog and multiple top level elements currently allowed (valid relaxNG?) 
...elements should be self-closing by default if no children
...should deleting the zeroth character of a name select the descendant range for deletion, an acceleration which indicates deletion of tree about to happen?
...should css 'tree' layout of element tree be optional, to permit people to view/edit the actual newline and tab (multiple &nbsp;) characters?
...should multiple range markers be used to indicate proposed changes arising from an atomic insertion or deletion which requires corresponding content for validity

Possible names
...stupeditor (0 hits on google)
