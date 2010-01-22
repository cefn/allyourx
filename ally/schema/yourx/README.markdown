This directory contains a series of metaschema, schema which describe a set of possible schema, which themselves characterise an XML dialect (or a set of possible XML files).

Each is illustrated by schema instances which conform to the metaschema, and examples of XML files which are both valid and invalid against the schema. Valid files are named simply team.001.xml, whilst invalid modifications of the same file are suffixed by letters, e.g. team.001a.xml, team.001b.xml. These examples are used in unit testing.

Bugs associated with the validation and autocompletion functions of the library can be submitted as unit tests which should be green, but which are in fact red. Examples of existing unit tests can be run by visiting the unit.html page in the ally/control/unit directory.
