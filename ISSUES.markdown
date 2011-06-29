Editor Errors
-------------

In all content
...control keys not detected or intercepted (e.g. HOME, END, PAGEUP, PAGEDOWN, ARROWS, CTRL+ARROWS, SHIFT+ARROWS
...range operations not handled (e.g. https://developer.mozilla.org/En/DOM:range)
...cannot delete first character once field is populated

Element rendering
...closing slash should be at beginning of close element, not at end

Between attributes
...unhandled character (only space or > allowed) not intercepted and browser inserts character

Within names
...deleting zeroth character of element/attribute doesn't delete element/attribute

Within names or content
... [>] interception problems, or somehow cursor moves to beginning of field before insertion

Within element content
...[>] only detected as second character
...cannot open an element by inserting [<] while typing in a text element

Within child element name 
...name edits to open tag not remapped to close tag

Mouse clicks do not move cursor (within either Thingy Tree or Avix-editable Dom

Design questions
...what support should exist for prolog
...should elements always be self-closing by default, and expanded by deleting [/] or overtyping with [>]?
...what is in-memory-model representation of self-closing element (could use zero-length text node for elements which are not self-closed)
...should deleting zeroth character of a name select the descendant range for deletion, an acceleration which indicates deletion of tree about to happen?
...should css 'tree' layout of element tree be optional, to permit people to view/edit the actual newline and tab (multiple &nbsp;) characters?

Validity questions (editor options - supported by RelaxNG?)
...text before prolog currently allowed
...multiple top level elements currently allowed

