<!DOCTYPE html SYSTEM "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:a="http://allyourx.org" xml:lang="en" lang="en">
    <head>
        <title>AllyourX - Control Interface</title>
        <link rel="stylesheet" href="../../jquery-ui-1.7.2/themes/base/ui.all.css" type="text/css"/>
        <link rel="stylesheet" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/le-frog/jquery-ui.css" type="text/css" />
        <link rel="stylesheet" href="control.css" type="text/css"/>
        <script type="text/javascript" src="../../jquery-ui-1.7.2/jquery-1.3.2.js"></script>
        <script type="text/javascript" src="../../livequery-1.0.3/jquery.livequery.js"></script>
        <script type="text/javascript" src="ally_bootstrap.js"></script>
        <script type="text/javascript" src="ally_jquery_bootstrap.js"></script>
        <script type="text/javascript" src="ally.js"></script>
        <script type="text/javascript" src="yourx.js"></script>
        <?sjs
            //<![CDATA[
			//this is executed server side before document load

				//bootstrap ALLY support  
				eval(pow_file('ally_bootstrap.js'));

				//bootstrap ALLY POW support  
				eval(pow_file('ally_pow_bootstrap.js'));

				//load ALLY core
				ALLY.evalFile('ally.js');

				//load YOURX core
				ALLY.evalFile('yourx.js');				
																
            //]]>
        ?>
        <script type="text/javascript">
            //<![CDATA[			
			$(function(){
				$("p").after(<p>This is written client side.</p>);
			});
            //]]>
        </script>
    </head>
    <body>
        <?sjs
            //<![CDATA[
				document.write(<p>This is written server side</p>);				
            //]]>
        ?>
    </body>
</html>
