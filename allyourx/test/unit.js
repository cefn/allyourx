//TODO protect test code with closure and namespace

function AssertException(message) { this.message = message; }
AssertException.prototype.toString = function () {
  return 'AssertException: ' + this.message;
};

function assert(exp, message) {
  if (exp !== true) {
    throw new AssertException(message);
  }
}

function testReport(desc,classes,report){
	$('#results').append("<div class='test " + classes + "'><h1>" + desc + "</h1><p>" + report  + "</p></div>");
}

/** Expects an array containing array-pairs of test descriptions and no-arg test functions. */
function executeTests(testpairs, options){ 
	for (var idx = 0; idx < testpairs.length; idx++) {
		/** Unmarshall test items. */
		var currentpair = testpairs[idx];
		var desc = currentpair[0];
		var test = currentpair[1];
		/** invoke single test with global object as this and empty arguments array */
		var testclasses = function(outcome){ return (outcome===true ? "good" : "bad")};
		var testmsg = function(outcome){ return (outcome===true ? "Success" : "Failure")};
		var result = false;
		try{
			var result = test.apply(this, []);		
			testReport(desc, testclasses(result), testmsg(result));
		}
		catch(e){
			testReport(desc, testclasses(result), "Exception thrown " + e);
		}
	}
}

