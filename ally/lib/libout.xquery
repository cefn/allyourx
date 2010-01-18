xquery version "1.0";

module namespace saxonb="http://cefn.com/saxonb/";

declare namespace saxon="http://saxon.sf.net/";
declare namespace xsl="http://www.w3.org/1999/XSL/Transform";
declare default function namespace "http://cefn.com/saxonb/"; 
declare default element namespace "http://www.w3.org/1999/xhtml"; 

declare function saxonb:write-html($href as xs:string, $docnode as item()){
    result-document($href,$docnode,	
                    <xsl:output method="html" indent="yes" doctype-public="-//W3C//DTD XHTML 1.0 Transitional//EN" doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" omit-xml-declaration="yes"/>)
};

(: This relies of Saxon B's support for dynamic compilation of XSLT 
permitting XQuery to output named result documents efficiently with 
a pre-compiled 'result-document' stylesheet:)
declare function saxonb:result-document($href as xs:string, $docnode as item(), $format as element(xsl:output)?){
    saxon:transform(
        saxon:compile-stylesheet(
            document{
                <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="2.0">
                    {$format}
                    <xsl:template match="/">
                        <xsl:result-document href="{$href}"><xsl:sequence select="/"/></xsl:result-document> 
                    </xsl:template> 
                </xsl:stylesheet>
            }
        ),
        document{
            $docnode
        }
    )
};