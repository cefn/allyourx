<html>
	<body>
  <textarea cols="80" rows="20">
  <?sjs
  	function getPostValue(name){
		if(name in pow_server.POST){
			return pow_server.POST[name];		
		}
		else{
			return '';
		}
	}
	
	/** Inspired by http://ecmanaut.blogspot.com/2006/07/expressive-user-scripts-with-xpath-and.html */
	function e4xVisitNodes( e4xroot, xpath, cb ){
		var e4xrootstring = e4xroot.toXMLString();
		var domparser=new DOMParser();
	    var domroot=domparser.parseFromString(e4xrootstring,"text/xml");
		var got = domroot.evaluate( xpath, domroot, null, XPathResult.ANY_TYPE, null );
		var next;
		while( next = got.iterateNext() ){
			cb(next);
		}
	}
	  
  	var e4xdata = 	<data>
						<item title={getPostValue('@title')} description={getPostValue('@description')}>
			    			<content>{getPostValue('content')}</content>
						</item>
					</data>;
	var serializer = new XMLSerializer();
	e4xVisitNodes(e4xdata, "//item[@title='hello there']", function(node){ document.write(serializer.serializeToString(node));});
				  
  ?>
  </textarea>			
	</body>
</html>
