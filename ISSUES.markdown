Editor Errors
-------------

In all content
...control keys not detected or intercepted (e.g. HOME, END, PAGEUP, PAGEDOWN, ARROWS, CTRL+ARROWS, SHIFT+ARROWS
...range operations such as shift-select mouse click or mouse drag not handled (e.g. https://developer.mozilla.org/En/DOM:range)

Between attributes
...unhandled character (only space or > allowed) not intercepted and browser inserts character

Everywhere
...backspace and delete should only delete when following... or preceding... caret are within the same range (same node and field)

Within text
...left arrow at zero character doesn't move to parent
...deleting last character doesn't remove text thingy
...inserting [<] doesn't trigger sibling element creation

Within names
...deleting zeroth character of element/attribute doesn't delete element/attribute
...blank names are considered valid, but should be impossible 

Within element name 
...cannot self-close
...empty elements aren't automatically self-closed
...no mechanism for controlling switch between self-closing or paired tags

Within element content
...cannot exit an element by typing[>] in text element or at element root
...text node creation routine is triggered even when text node exists

Design questions
...make whole tree contenteditable and monitor cursor location changes for round-tripping? 
...what support should exist for xml prolog
...should elements always be self-closing by default, and expanded by deleting [/] or overtyping with [>]?
...what is in-memory-model representation of self-closing element (could use zero-length text node for elements which are not self-closed)
...should deleting zeroth character of a name select the descendant range for deletion, an acceleration which indicates deletion of tree about to happen?
...should css 'tree' layout of element tree be optional, to permit people to view/edit the actual newline and tab (multiple &nbsp;) characters?
...should multiple range markers be used to indicate proposed changes arising from an atomic insertion or deletion which requires corresponding content for validity

Validity questions (editor options - supported by RelaxNG?)
...text before prolog currently allowed
...multiple top level elements currently allowed

Possible names
...stupeditor (0 hits on google)

