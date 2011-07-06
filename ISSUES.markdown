Editor Errors
-------------

Everywhere
...backspace and delete should only delete when following... or preceding... caret are within the same range (same node and field)
...should change xopen and xclose spans so they enclose entire open and close sections. Currently they are empty and do not indicate boundaries.
...range operations such as shift-select mouse click or mouse drag not handled (e.g. https://developer.mozilla.org/En/DOM:range)

Between attributes
... logic of special caret name '>' for final position is not yet proven (see speculative note below no longer valid since discovery of '>' key
... attribute preceding and following caret sequence needs verifying
... attribute ordering function referenced but doesn't exist, is it now implicit in both memory model and serialisation?
... Should reassign attribute key identities? Cursor appearing after selected caret item is inconsistent with other caret behaviour. Could use "" as key for final position (position of potential attribute), with similar behaviour to element descendant position 0 (node created on keypress). However, issue arises when there is in fact a "" attribute (whilst being typed). Could somehow suppress this, or change behaviour so that only when key is pressed does the attribute actually appear. Need to check logic for ordering of attributes.

Within text
...left arrow at zero character doesn't move to parent
...deleting last character doesn't remove text thingy
...inserting [<] doesn't trigger sibling element creation

Within names
...deleting zeroth character of element/attribute doesn't delete element/attribute
...blank names are considered valid, but should be impossible 

Within element name 
...cannot self-close, editors should expand by deleting [/] or overtyping with [>]?
...view switch not just based on in-memory thingy tree, but also on editor caret, else cannot position caret to create children in empty element
...could make paired tags appear by inserting zero-length text in memory, separate question from serialisation choices (self-closing where empty)  
...empty elements aren't automatically self-closed
...no mechanism for controlling switch between self-closing or paired tags
...question - what is caret position to permit deleting trailing slash of self-closing tag?

Within element content
...cannot exit an element by typing[>] in text element or at element root
...text node creation routine is triggered even when text node exists

Design questions
...should change to self-closing tag be propagated up to RecursiveView?
...monitor cursor location changes for round-tripping between DOM and ThingyTree? 
...what support should exist for xml prolog
.. elements should be self-closing by default if no children
...should deleting zeroth character of a name select the descendant range for deletion, an acceleration which indicates deletion of tree about to happen?
...should css 'tree' layout of element tree be optional, to permit people to view/edit the actual newline and tab (multiple &nbsp;) characters?
...should multiple range markers be used to indicate proposed changes arising from an atomic insertion or deletion which requires corresponding content for validity

Validity questions (editor options - supported by RelaxNG?)
...text before prolog currently allowed
...multiple top level elements currently allowed

Possible names
...stupeditor (0 hits on google)

