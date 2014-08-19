STORY: SENTENCE-DRIVEN GRAMMAR RECONCILIATION

As a stakeholder I want a freeform tool for expressing device behaviours, using a representation which is familiar, but can incrementally satisfy the constraints of deployment, so that the behaviours I express can move progressively, yet comprehensibly towards deployment until they are live.

There will be a visualisation of valid programs which represents them in e.g. tile-based language (Scratch) or other syntax tree (XML) or object code (Python). Coupled to this will be a representation and possibly a visualisation of the Grammar which asserts constraints for valid programs. In a workshop, a stakeholder should be able to freely author 'invalid' programs which appear well-formed, appearing just like a valid program. Behind the scenes, a model of the invalid program is maintained as an abstract syntax tree (AST), and operations should appear which will either force the grammar to fit the AST, or force the AST to fit the grammar. Specialists can mark up the grammar with target code fragments to ensure 'computability' of any valid programs. In general a real-time analysis of the fit between AST and grammar (based on relaxed, resumable parsing) should be running continuously as both are changed through editing operations, and the editing operations available/presented/recommended should be based on the results of that fit. The objective of the interface is to be able to move from expressive block-based programs written as english sentences, through to finally running the code on the target device.

* TASKS
	- Create a tool in which multiple panes and controls are coordinated through a shared in-memory model of the current invalid AST having
		- a pane in AST presentation as a tree of embedded elements with attributes (XML is canonical)
		- a pane in TILE presentation as a visual language (Scratch as reference)
		- a pane in TARGET presentation as executable code (Python is canonical)
		- a pane representing the GRAMMAR, including the TARGET mapping if it exists
	- Offer interface presentation and key/mouse event handling to enable
		- origination of new elements/blocks/code fragments (as part of freeform expression)
		- alerting of not-yet-legal language structures
		
 
