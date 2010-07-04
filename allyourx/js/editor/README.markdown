Statement of principles

This modeless moded editor combines the 'text entry' and 'command' mode of vi, using XML validation rules to determine which mode is active at any given time.

If a key pressed could continue the XML document where the cursor is, then the character is inserted, with whatever additional components are needed to complete valid XML. The caret then moves forward to the next editable part of the document

If a key pressed is invalid in the context of the cursor, then it moves the cursor to the next occurrence of the character, (or the next location where that character could be inserted, whichever is the sooner?).

Arrow keys work as normal, but visit only the parts of the document which are editable, skipping over structures which are mandatory.

Deletion and creation of structures is all-or-nothing. In a schemaless scenario, well-formedness is preserved by editing operations. For example, element and attribute clauses are atomic, but their names are not. In a schema-driven scenario, validity is enforced.





INSIDE TAGS



OUTSIDE TAGS (when in children of a container)

KEY	NAVIGATION		ACTION			FOCUS

< 				create new element 	elname of new element
>		
