Create a google app engine host for XML files providing...
- A filesystem-like exposure - probably WEBDAV through Milton (provides Zsync/rsync support)
- XQuery exposure - allowing the serving of queries backed by the XML
- Ordinary readable/writeable filesystem - permitting CSS and stuff to be stored and referenced - (Milton and GaeVFS combines in gae-webdav project)

Create a git or SVN based server component which rsyncs the WebDav filesystem and versions it on request

Freely licensed Xquery library can be exposed through XQJ and provided from 
- saxon-he (Mozilla licence)
- mxquery (Apache license)
- jdeveloper (oracle licence allows distribution if developed in the JDeveloper tool perhaps?)
