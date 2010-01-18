# AllyourX Canonical Implementation

This is work in progress on a canonical implementation of a framework complying with the AllyourX standard. It should provide a proof-of-concept of the rationale at http://allyourx.org

A by-product is the creation of a validating XML editor with autocompletion, which binds against RelaxNG schemata for XML.

Three types of milestone are important in the development of this code. 

1. The generator reading annotated RelaxNG schema, (describing the data requested from users by your application), and creating user-facing input forms for that data.
2. Canonical interactions with a simple server-side component which handles saving, loading and querying XML authored by users. 
3. Builds of the generator which are able to actually author RelaxNG, hiding both XML and XML schema authoring from users altogether.
4. Iterations of 1) and 2) to introduce additional features to parameterise user-facing controls (e.g. labels, database cross-validation) and server-hosted functions (e.g. versioning, indexing).

The canonical implementation will be able to author valid XML using entirely client-side technologies, although the use of these libraries in a server-side javascript environment such as Jack, or simply Rhino running in a Java servlet, is specifically anticipated. Prototyping to date has taken place using the Plain Old Webserver project. The Appenginejs project provides a proof of concept of running javascript on Google App Engine, which is perhaps a better target.

The project is planned with strict stages of increasingly complex RelaxNG. These subsets of RelaxNG are themselves defined using RelaxNG as follows...

* v001 ([schema](allyourx/tree/master/ally/lib/schema/yourx/yourx.001.rng)) ([examples](allyourx/tree/master/ally/lib/schema/yourx/examples.001/))
* v002 ([schema](allyourx/tree/master/ally/lib/schema/yourx/yourx.002.rng)) (examples to be authored))
* v003 ([schema](allyourx/tree/master/ally/lib/schema/yourx/yourx.003.rng)) (examples to be authored)
* v004 ([schema](allyourx/tree/master/ally/lib/schema/yourx/yourx.004.rng)) (examples to be authored)
* Target ([schema](allyourx/tree/master/ally/lib/schema/yourx/yourx.target.rng)) (examples to be authored)

The use of these strict targets allows debugging to proceed incrementally. Initially, any bug experienced with a data specification conforming to the v001 schema will be accepted into the bugtracker for a release promising conformance with v001. We believe that many applications can already describe all their data using just the v001 schema. However, long term conformance to the schema described by [yourx.target.rng][ally/lib/schema/yourx/yourx.001.rng] is desired and development will proceed with this aim. 

An implementation with at least some form of closure, as described in milestone 3) above, will mean that ordinary users can use the graphical front end to define their own schemas, avoiding the need for RelaxNG tools directly except for debugging.

A professional developer working in this area may employ a commercial RelaxNG schema-driven-authoring tool such as OxygenXML http://www.oxygenxml.com/ to author compliant schemas. Others may prefer manually editing the files with the direct use of a validator such as Jing to establish conformance http://www.thaiopensource.com/relaxng/jing.html 

A simple alternative is to slightly modify the definitions of existing example files until they are satisfactory for your application (e.g. change the names of elements and attributes).

