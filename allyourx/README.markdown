# A canonical implementation for the AllyourX standard 

## Ally - A RelaxNG schema-driven authoring editor for XML.

This is work in progress on a canonical implementation of a data authoring framework complying with the AllyourX standard. It should provide a proof-of-concept of the rationale at [http://allyourx.org](http://allyourx.org). A by-product is the creation of a validating XML editor with autocompletion, which binds against RelaxNG schemata for XML. This component is designed to be used independently of the framework.

### Licensing

The AllyourX standard is public domain. This software is distributed under the GPL version 3. If you would like to distribute the software under another license, contact the authors.

### Features

The canonical implementation of the editor for each version of AllyourX will be able to author valid XML as defined by a annotated RelaxNG schema conforming to the version's metaschema (see below) using entirely client-side javascript technologies.

Three types of milestone are important in the development of this canonical code. 

1. A generator capable of reading annotated RelaxNG schema, (describing the data requested from users by your application), for metaschema v00X and creating user-facing input forms for that data.
2. Reference implementation of a simple server-side component which handles saving, loading and querying XML authored client-side by users.
3. Builds of the generator which are able to actually author instances of RelaxNG (the XML dialect expressing the schemas), hiding the text form of XML altogether.
4. Iterations of 1) and 2) to introduce additional features to parameterise user-facing controls (e.g. labels, database cross-validation) and server-hosted functions (e.g. versioning, indexing).

### Hosts and Ports

The use of the client-side javascript libraries in a server-side javascript environment such as Jack, or simply Rhino running in a Java servlet, is specifically anticipated. 

Prototyping to date has taken place running in the Plain Old Webserver Xulrunner-based webserver (also available as a Firefox plugin). The Appenginejs project provides a proof of concept of running javascript on Google App Engine which is perhaps a better target for long term centralised hosting.

The AllyourX standard is designed expressly to capture the definition of an application's data in a platform non-specific way. Consequently implementations using other platforms such as PHP, Ruby, Java, CouchDB with Filesystem, MySQL, Postgres or DBXML storage will be welcomed as the project develops momentum.

### Project Planning

The project is planned with strict stages of increasingly complex RelaxNG, allowing clear unit tests and counterexamples to be identified. These subsets of RelaxNG are themselves defined using RelaxNG metaschema as follows...

* v001 ([metaschema](test/schema/yourx/yourx.001.rng)) ([unit testing examples](test/schema/yourx/examples.001/))
* v002 ([metaschema](test/schema/yourx/yourx.002.rng)) (examples to be authored))
* v003 ([metaschema](test/schema/yourx/yourx.003.rng)) (examples to be authored)
* v004 ([metaschema](test/schema/yourx/yourx.004.rng)) (examples to be authored)
* v005 ([metaschema](test/schema/yourx/yourx.005.rng)) (examples to be authored)
* Target ([metaschema](test/schema/yourx/yourx.target.rng)) (examples to be authored)

Each schema complexity version should express a set of languages which includes the preceding set language as a strict subset. An editor which is conformant with a given version should be able to author every member of the given set of languages. An example of a schema which conforms to the schema 

The use of these strict targets allows debugging to proceed incrementally. Initially, any bug experienced with a data specification conforming to the v001 schema will be accepted into the bugtracker for a release promising conformance with v001. We believe that many applications can already describe individual records using just the v001 schema. However, long term conformance to the schema described by the target metaschema [yourx.target.rng](lib/schema/yourx/yourx.target.rng) is desired and development will proceed through increasingly complex versions with this aim.

An implementation with at least some form of closure, as described in milestone 3) above, will mean that ordinary users can use the graphical front end to define their own schemas, avoiding the need for RelaxNG tools directly except for debugging or for more advanced data structures than those authorable by the editor at that time. In other words, when the schema-driven AllyourX editor is capable of authoring against a metaschema itself, then people don't need to see the underlying RelaxNG in its xml stream form, or the XML authored against it.

### Creating and using your own schema

A professional developer working in this area may employ a commercial RelaxNG schema-driven-authoring tool such as OxygenXML http://www.oxygenxml.com/ to author compliant schemas validating against v00X. Others may prefer manually editing the files with the direct use of a validator such as Jing to establish conformance http://www.thaiopensource.com/relaxng/jing.html 

A simple alternative is to slightly modify the definitions of existing example files until they are satisfactory for your application (e.g. change the names of elements and attributes).

Contributors should note that the canonical code and the standard itself is prone to radical change as version 001 is approached, and versions 002-005 may also change based on feedback from participants, as deployment issues are encountered and improved definitions are proposed.

Have fun.
