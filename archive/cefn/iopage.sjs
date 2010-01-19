<!DOCTYPE html SYSTEM "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
        <title>GIGOX</title>
        <!-- jQuery library is required, see http://jquery.com/ -->
        <script type="text/javascript" src="../jquery/jquery.js"></script>
        <!-- WYMeditor main JS file, packed version -->
        <script type="text/javascript" src="../wymeditor/jquery.wymeditor.pack.js"></script>
        <!-- Application code -->
        <script type="text/javascript" src="iolib.js"></script>
        <script type="text/javascript" src="iodefaults.js"></script>
        <script type="text/javascript" src="iooverride.js"></script>		
        <script type="text/javascript" src="ioedit.js"></script>
		<script type="text/javascript" >
			<!--			
			function report(txt){
				$("div#info").text(txt);
			}
			
			$(function(){
				//Thingy validation 
				/** 
				try{
					var consumed = getThingyRule().greedyConsume([getThingy()]);			
					report("The number of items consumed is " + consumed);
				}
				catch(e){
					report("An error was encountered");
				}
				*/
				//ensure no form reloads page
				$("form").submit(function(){
					return false;
				});				
				//Editing config
				$(".element form").submit(function(){
					$(".editor").find("#caret").replaceWith('<div class="element"><h2>' + $(this).find("input[name=name]").val() + '</h2></div><div id="caret"></div>');
				});				
			});
  			// -->
		</script>
    </head>
    <body>
		<table>
			<tr>
				<td class="editor">
					<div class="empty document" id="caret">
					</div>
				</td>
				<td class="controls">
					<div class="element">
						<h2>Element</h2>
						<form action="#">
							<label for="name">Element name</label>
							<input name="name" type="text"/>
							<label class="advanced" for="namespace">Namespace</label>
							<input class="advanced" name="namespace" type="text"/>
							<input type="submit" />
						</form>
					</div>
					<div class="attribute">
						<h2>Attribute</h2>
						<form action="#">
							<label for="name">Name</label>
							<input name="name" type="text"/>
							<label class="advanced" for="namespace">Namespace</label>
							<input class="advanced" name="namespace" type="text"/>
							<br/>
							<label for="value">Value</label>
							<input name="value" type="text"/>
							<input type="submit" />
						</form>
					</div>
					<div class="text">
						<h2>Text</h2>
						<form action="#">
							<label for="value">Text</label>
							<textarea name="value" cols="32" rows="4" style="width:33em;height:4em;">
							</textarea>
							<input type="submit" />
						</form>
					</div>
				</td>
			</tr>
		</table>
    </body>
</html>