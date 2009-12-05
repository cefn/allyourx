<!DOCTYPE html SYSTEM "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <title>GIGOX</title>
        <!-- jQuery library is required, see http://jquery.com/ -->
        <script type="text/javascript" src="../jquery/jquery.js"></script>
        <!-- WYMeditor main JS file, packed version -->
        <script type="text/javascript" src="../wymeditor/jquery.wymeditor.pack.js"></script>
        <!-- Application code -->
        <script type="text/javascript" src="cefn.js"></script>
    </head>
    <body>
        <form class="cefn" method="post" action="save.sjs">
        	<table>
        		<tr>
        			<td><label for="@title">Title</label></td><td><input class="cefn" type="text" name="@title" /></td>
				</tr>
        		<tr>
        			<td><label for="@description">Description</label></td><td><input class="cefn" type="text" name="@description" /></td>
				</tr>
        		<tr>
        			<td><label for="content">Content</label></td><td><textarea class="cefn" name="content" ></textarea></td>
				</tr>
			</table>
            <input type="submit" class="wymupdate"/>
        </form>
    </body>
</html>