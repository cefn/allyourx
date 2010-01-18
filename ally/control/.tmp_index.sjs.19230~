<!DOCTYPE html SYSTEM "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:a="http://allyourx.org" xml:lang="en" lang="en">
    <head>
        <title>AllyourX - Control Interface</title>
        <link rel="stylesheet" href="../../jquery-ui-1.7.2/themes/base/ui.all.css" type="text/css"/>
        <link rel="stylesheet" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/le-frog/jquery-ui.css" type="text/css" />
        <link rel="stylesheet" href="control.css" type="text/css"/>
        <script type="text/javascript" src="../../jquery-ui-1.7.2/jquery-1.3.2.js">
        </script>
        <script type="text/javascript" src="../../livequery-1.0.3/jquery.livequery.js">
        </script>
        <script type="text/javascript" src="../../jquery-ui-1.7.2/ui/ui.core.js">
        </script>
        <script type="text/javascript" src="../../jquery-ui-1.7.2/ui/ui.tabs.js">
        </script>
        <script type="text/javascript" src="yourx_bootstrap.js">
        </script>
        <script type="text/javascript" src="yourx.js">
        </script>
        <script type="text/javascript" src="ally.js">
        </script>
        <script type="text/javascript" src="ally_ui_jqueryui.js">
        </script>
        <?sjs
			//this is executed server side before document load, 
			//bringing in equivalent libraries to those loaded client-side		
            //<![CDATA[
			
				//load YOURX core
				//eval(pow_file('yourx_bootstrap.js'));
				
				//bootstrap ALLY  
				//YOURX.evalFile('yourx.js');

				//load ALLY core
				//YOURX.evalFile('ally.js');
				
				//var rootthingy = new YOURX.ThingyUtil.url2yourx("../data/data.xml");
																
            //]]>
        ?>
        <script type="text/javascript">
            //<![CDATA[
			
	            $(function(){
					
	                $("#xdata").tabs();
	
					ALLY.bindThingy(rootthingy,$("#xdatagui"));
					rootthingy.addChild(new YOURX.TextThingy("This is a test"));
	
	            });			
			
            //]]>
        </script>
    </head>
    <body>
        <div id="xdata">
            <ul>
                <li>
                    <a href="#xdatagui">GUI</a>
                </li>
                <li>
                    <a href="#xdataxml">XML</a>
                </li>
                <li>
                    <a href="#xdatajson">JSON</a>
                </li>
            </ul>
            <div id="xdatagui">
            </div>
            <div id="xdataxml">
            </div>
            <div id="xdatajson">
            </div>
        </div>
    </body>
</html>
