# AllyourX Canonical Implementation

This is work in progress on a canonical implementation of a framework complying with the AllyourX standard.

It should provide a proof-of-concept of the rationale at http://allyourx.org

A by-product is the creation of a validating XML editor with autocompletion, which binds against RelaxNG schemata for XML.

Three types of milestone are important in the development of this code. 

1. The generator reading annotated RelaxNG schema, (describing the data requested from users by your application), and outputting input forms.
2. Canonical interactions with a simple server-side component which handles saving, loading and querying XML authored by users. 
3. Builds of the generator which are able to actually author RelaxNG, hiding both XML and XML schema authoring from users altogether.

The canonical implementation will be able to author valid XML using entirely client-side technologies, although the use of these libraries in a server-side javascript environment such as Jack, or simply Rhino running in a Java servlet, is specifically anticipated. Prototyping to date has taken place using the Plain Old Webserver project. The Appenginejs project provides a proof of concept of running javascript on Google App Engine, which is perhaps a better target.

The project is planned with strict stages of increasingly complex RelaxNG. These subsets of RelaxNG are themselves defined using RelaxNG as follows...

* v001 ([schema](tree/master/ally/lib/schema/yourx/yourx.001.rng)) ([examples](tree/master/ally/lib/schema/yourx/examples.001/))

A professional developer working in this area may employ a commercial schema-driven-authoring tool such as OxygenXML http://www.oxygenxml.com/ to author compliant schemas. Others may prefer manually editing the files with the direct use of a validator such as Jing to establish conformance http://www.thaiopensource.com/relaxng/jing.html 

The use of these strict targets allows debugging to proceed incrementally. Initially, any bug experienced with a data specification conforming to the v001 schema will be accepted into the bugtracker for a release promising conformance with v001. We believe that many applications can already describe all their data using just the v001 schema. However, long term conformance to the schema described by [yourx.target.rng][ally/lib/schema/yourx/yourx.001.rng] is desired and development will proceed with this aim. 
