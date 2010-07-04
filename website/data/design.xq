xquery version "1.0";

import module namespace saxonb = "http://cefn.com/saxonb/" at "../lib/libout.xquery";
declare namespace c="http://cefn.com/";
declare default element namespace "http://www.w3.org/1999/xhtml";

declare function c:outputhtml($title, $path, $href, $content, $menu, $news){
    saxonb:write-html($href,
        <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
            <head>
                <title>AllyourX - {$title}</title>
                <meta content="application/xhtml+xml; charset=UTF-8" http-equiv="content-type"></meta>
                <meta content="Allyourx.org" name="generator"></meta>
                <meta content="Schema language incorporating form metadata" name="description"></meta>
                <meta content="xml, xhtml, forms, schema, metadata, input, controls, framework, scaffolding, crud, relaxng, jquery, wymeditor" name="keywords"></meta>
                <link href="assets/css/reset-min.css" media="screen, tv, projection" rel="stylesheet" title="Default" type="text/css"></link>
                <link href="assets/css/fonts-min.css" media="screen, tv, projection" rel="stylesheet" title="Default" type="text/css"></link>
                <link href="assets/css/allyourx_pre.css" media="screen, tv, projection" rel="stylesheet" title="Default" type="text/css"></link>
                <link href="assets/css/bluesky.css" media="screen, tv, projection" rel="stylesheet" title="Default" type="text/css"></link>
                <link href="assets/css/bluesky_large.css" media="screen, projection, tv" rel="alternative stylesheet" title="Larger Fonts" type="text/css"></link>
                <link href="assets/css/print.css" media="screen" rel="alternative stylesheet" title="Print Preview" type="text/css"></link>
                <link href="assets/css/handheld.css" media="screen" rel="alternative stylesheet" title="Small Layout Preview" type="text/css"></link>
                <link href="assets/css/handheld.css" media="handheld" rel="stylesheet" title="Small Layout" type="text/css"></link>
                <link href="assets/css/print.css" media="print" rel="stylesheet" type="text/css"></link>
                <link href="assets/css/allyourx_post.css" media="screen, tv, projection" rel="stylesheet" title="Default" type="text/css"></link>
                <script type="text/javascript">
                      <![CDATA[
                        var _gaq = _gaq || [];
                        _gaq.push(['_setAccount', 'UA-1301819-2']);
                        _gaq.push(['_trackPageview']);
                        
                        (function() {
                        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
                        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
                        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(ga);
                        })();
                      ]]>
                </script>
                </head>
            <body>
                <div id="page">
                    <div id="header-right">
                        Free, liberty-enhancing, cross-platform data wrangling.
                    </div>
                    <div id="header">
                        <a href="index.html">AllyourX</a> <img class="logo" src="assets/images/logo.png" alt="A lot of graphical eggs in a basket"/>               
                    </div>
                    <div id="wrapper">
                        <div id="content">
                            <div id="main">
                                <h1>{$title}</h1>
                                {$content}
                            </div>
                        </div>
                        <div id="left">
                            <div id="nav">
                                <h3>Learning</h3>
                                <div class="inner_box">
                                    {$menu}
                                </div>
                            </div>
                            <div class="left_box">
                                <h3>Developments</h3>
                                <div class="inner_box">
                                    {$news}
                                </div>
                            </div>
                            <div class="left_box">
                                <h3>Giants' Shoulders</h3>
                                <div class="inner_box">
                                    <p> 
                                        - <a href="http://relaxng.org/">Relax NG</a><br/> 
                                        - <a href="http://saxon.sourceforge.net/">Saxon</a><br/>
                                        - <a href="http://jquery.com/">JQuery</a><br/> 
                                        - <a href="http://docs.jquery.com/Plugins/livequery">Livequery</a><br/> 
                                        - <a href="http://www.wymeditor.org/">WYMeditor</a><br/>
                                        - <a href="http://http://davidkellogg.com/wiki/Main_Page/">POW</a><br/>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="footer">
                        <p> 
                            Copyleft©2009 <a href="http://allyourx.co.uk" >Allyourx.org</a>. Maintained by <a href="http://cefn.com" >Cefn Hoile</a> Design by <a href="http://www.jonasjohn.de/" >Jonas John</a>.
                        <a href="http://validator.w3.org/check/referer"  >Valid XHTML</a> and <a href="http://jigsaw.w3.org/css-validator/check/referer" >Valid CSS</a>
                        </p>
                    </div>
                </div>
            </body>
        </html>    
    )
};

declare function c:writelabel($node){
        <div>
            {if($node/@title) then (<h2>{string($node/@title)}</h2>) else ()}
            {if($node/@desc) then (<p>{string($node/@desc)}</p>) else ()}
        </div>
};

declare function c:href($node as item()) as xs:string{
    typeswitch($node)
        case $step as element(step) return (
            let $parent := $step/parent::tutorial
            return concat(index-of($parent/step, $step), '_', $parent/@id, '.html')            
        )
        case $tutorial as element(tutorial) return(
            c:href($tutorial/step[1])        
        )
        default $item return concat($item/@id, '.html')
};

declare function c:writelist($nodes){
    for $node in $nodes order by $node/@title return <p>{c:writelink($node)}</p>
};

declare function c:writelink($node){
    <a href="{c:href($node)}">{string($node/@title)}</a>
};

declare function c:writemenu($node){
    <ul>
        <li><a href="index.html" >Intro</a></li>
        <li><a href="1_end_to_end.html" >Example</a></li>
        <li><a href="vision.html" >Vision</a></li>
        <li><a href="list_faq.html" >Asked</a></li>
        <li><a href="team.html" >Team</a></li>
    </ul>
};
declare function c:writenews($node){
    <h1>Desktop data hosting</h1>,
    <p>
        A free firefox plugin to edit your data 
        and generate rich data-driven websites. 
    </p>,
    <p>
        Your bespoke blog, calendar or online catalog in just a few lines of code.
    </p>,
    <p>
        <a href="software.html#allyourx.co.uk">Read more</a>
   </p>
};

declare function c:crumbs($item){
    typeswitch($item)
        case $step as element(step) return (
            let $prev := $step/preceding-sibling::step[1],
                $next := $step/following-sibling::step[1]
                return (
                    if($prev) then <a href="{c:href($prev)}">&lt;&lt;{string($prev/@title)}&lt;&lt;</a> else (),
                    <a href="{c:href($step)}">{string($step/@title)}</a>,
                    if($next) then <a href="{c:href($next)}">&gt;&gt;{string($next/@title)} &gt;&gt;</a> else ()
                )        
        )
        default return ()
};

declare function c:outputitem($item){
    c:outputhtml(string($item/@title), c:crumbs($item), c:href($item), $item/node(), c:writemenu($item), c:writenews($item))    
};

declare function c:outputstep($item){
    let $parent := $item/parent::tutorial,
        $prev := $item/preceding-sibling::step[1],
        $next := $item/following-sibling::step[1],
        $content := (
            $item/node(),
            <div id="path">
                {
                    if($prev) then <a style="display:block;float:left;" href="{c:href($prev)}">&lt;&lt; Previous : {string($prev/@title)}&lt;&lt;</a> else (),
                    if($next) then <a style="display:block;float:right;" href="{c:href($next)}">&gt;&gt; Next : {string($next/@title)} &gt;&gt;</a> else ()
                }
                &#160;
            </div>
    )        
    return c:outputhtml(concat(string($parent/@title), ' :: ', string($item/@title)), c:crumbs($item), c:href($item), $content, c:writemenu($item), c:writenews($item))    
};

declare function c:outputfaqs($href, $faqs){
    let $content := (
        <ul>{for $faq at $pos in $faqs return <li><a href="#{$pos}">{string($faq/question/text())}</a></li>}</ul>,
        for $faq at $pos in $faqs return (<h1><a name="{$pos}">{$faq/question/text()}</a></h1>,$faq/answer/node())
    )
    return c:outputhtml('Frequently Asked Questions', (), $href, $content, c:writemenu($faqs), c:writenews($faqs))
};

let $source := doc('data.xml')
return (
    for $page in $source//page return c:outputitem($page),
    for $step in $source//step return c:outputstep($step),
    c:outputfaqs('list_faq.html', $source//faq)
)