function testReport(desc,classes,report){
	$('#results').prepend("<div class='test " + classes + "'><h1>" + desc + "</h1><p>" + report  + "</p></div>");
}

/** Expects an array containing array-pairs of test descriptions and no-arg test functions. */
function executeTests(testpairs, options){ 
	for (var idx = 0; idx < testpairs.length; idx++) {
		/** Unmarshall test items. */
		var currentpair = testpairs[idx];
		var desc = currentpair[0];
		var test = currentpair[1];
		/** invoke single test with global object as this and empty arguments array */
		var result = test.apply(this, []);
		testReport(desc, (result ? "good" : "bad"), (result ? "Success" : "Failure"));
	}
}

