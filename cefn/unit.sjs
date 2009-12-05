<?sjs pow_header("Content-Type:application/xhtml+xml"); ?><!DOCTYPE html SYSTEM "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"><head>
        <title>Unit Testing Page</title>
		<link rel="stylesheet" href="unit.css"></link>
		<!-- jQuery library is required, see http://jquery.com/ -->
        <script type="text/javascript" src="../jquery/jquery.js"></script>
		<!-- Bring in unit testing framework-->
        <script type="text/javascript" src="unit.js"></script>
		<?sjs 
				//Import utility configuration
				eval(pow_file('powutil.js'));
														
				//Try to get the target library to debug from URL submitted argument
				var getarg = null;
				var getargname = 'libname';
				if(getargname in pow_server.GET){
					getarg = pow_server.GET[getargname];
				}

				document.write(<script type='text/javascript' src={getarg + '.js'}></script>);
				document.write(<script type='text/javascript' src={getarg + '.unit.js'}></script>);			
		?>
		</head>
	<?sjs
			if(getarg == null){
				document.write(<body><p>No library name passed in get argument {getargname}</p></body>);
			}
			else{
				document.write(<body><h1>Test results</h1><div id="results"></div></body>);
			}
	?>
</html>