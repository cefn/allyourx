AllyourX
========

AllyourX is a toolset combining standards and libraries making data-driven applications easy to build

The approach allows the application designer to specify...

* a description of the data structures needed from the app's users
* their choice of front end interface for users to author valid data
* their choice of back end store to capture and serve back the data to the application

...and then simply deploy their application.

Development
===========

The focus of development today is a javascript-based library for in-memory schema validation of whole and partial tree-structured data. The library supports the interactive authoring of valid trees through pluggable front end implementations. Editing operations are chosen which establish and preserve tree validity against the schema. The underpinning schema logic can be queried by a graphical editor to identify available edits. The editor can then serve these options to users in their own way.

The data structures which can be edited by AllyourX are homologous with the XML infoset, itself equivalent to nested javascript arrays containing strings or objects as leaves. XML is a natural choice as a file and network representation of this data. The on-disk representation of the schema language is an annotated form of the RelaxNG XML schema language.

Some implementations are intended for data entry by everyday users, and others for power users. The common underpinnings shared by views on the tree structure permits multiple editors to be kept in synchrony simultaneously, and further domain-specific editors should be trivial to build using these as examples.

Over time, development emphasis will shift to the back-end storage and querying infrastructure. However, the front-end editors and javascript validation library is expected to be useful to developers who can roll their own back ends to handle user-authored XML.

A comprehensive unit-testing suite is available to for test-driven development and to ensure no regressions appear in the codebase. This suite applies not only to the backing library, but also to the interactive editors, scenarios driven through DOM eventing. Development against these testing suites takes place on github.

Two sets of targets defined at any one time and available for discussion and contributions, tactical and strategic.

Tactical targets
================

Tactical targets are individual point demonstrations of the AllyourX library capabilities, illustrated by selecting a domain, a target user, front end and back end, and testing a specific version of the AllyourX toolset (see versioning milestones under Strategic targets).

Tactical targets would ideally remain current against later schema releases, but there is no guarantee of this support.

Tactical targets are currently as follows, with functionality validated against the v001 test schemas and documents...

Avixe : Always Valid Interactive XML Editor, a code-highlighting autocompletion editor for general XML based on contentEditable HTML, intended for developers and backed by AllyourX.

Euxe : End-user XML Editor, a graphical editor which hides the authoring of a valid XML tree behind common-sense labelled JQuery-ui graphical components (see the proof of concept at http://allyourx.org).

Strategic Targets
=================

Strategic targets are long term and define the evolution of the toolset through a pre-defined trajectory of increasingly-rich expressiveness for the supported schema language. 

You can see the expressiveness milestones for v001 through v005 as well as the final target expressiveness for the schema language. All dialects of the AllyourX schema language are a strict subset of RelaxNG annotated to provide information to style and define behaviour for user-facing controls.

Although the project is committed to a roadmap in which schema complexity increases only incrementally, we welcome contributions to re-prioritise schema features according to the needs of the user community.

Code should ideally conform to the guidance at http://javascript.crockford.com/code.html