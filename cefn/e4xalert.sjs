<?sjs
	var e4x = <p>This needs a toXMLString() invocation</p>;
	alert("The e4x object " + (("toXMLString" in e4x)?"has":"doesn't have") + " a toXMLString() method");
?>