xquery version "1.0";

import module namespace saxonb = "http://cefn.com/saxonb/" at "../lib/libout.xquery";
declare namespace c="http://cefn.com/";
declare default element namespace "http://www.w3.org/1999/xhtml";

declare function c:writepage($href, $content, $menu){
    saxonb:write-html($href,
        <html>
        	<head>
        		<link rel="stylesheet" href="assets/style.css" type="text/css"/>
        	</head>
        	<body>
        		<div class="content">
        			<h1>
        				<a href="page_rationale.html"><span class="mute">wi</span><span class="bright">doh</span></a>
        			</h1>
        			<ul class="menu">
        				<li>
        					<a href="list_persons.html">People</a>
        				</li>
        				<li>
        					<a href="list_projects.html">Projects</a>
        				</li>
        				<li>
        					<a href="page_rationale.html">Rationale</a>
        				</li>
        				<li>
        					<a href="page_index.html">About</a>
        				</li>
        			</ul>
        			<div class="page">
        			    {$content}
        			</div>
        			<div class="menu">
        			    {$menu}
        			</div>
        			<div class="footer">
        				CSS copyright: © 2008, Cefn Hoile, inspired by Adam Particka's orangray.      
        			</div>
        		</div>
        	</body>
        </html>
    )
};

declare function c:href($node as item()) as xs:string{
    concat(local-name($node), '_', $node/@id, '.html')
};

let $source := doc('data.xml'),
    $allpages := $source//page,
    $defaultmenu := <div><h2>What I Did On Holiday</h2><p>A collection of technology projects undertaken by BT employees in their spare time</p></div>
return (
    for $page in $allpages return c:writepage(c:href($page),$page/*, $defaultmenu) 
)