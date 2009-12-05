<?sjs 
//pow_header("Content-Type:application/xhtml+xml"); 
pow_header("Content-Type:text/html"); 
?><!DOCTYPE html SYSTEM "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
    <head>
        <title>jQuery UI Accordion - Default functionality</title>
        <link rel="stylesheet" href="../../jquery-ui-1.7.2/themes/base/ui.all.css" type="text/css"/>
        <link rel="stylesheet" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/le-frog/jquery-ui.css" type="text/css" />
        <!-- <link rel="stylesheet" href="../../jquery-ui-1.7.2/demos/demos.css" type="text/css"/> -->
        <link rel="stylesheet" href="form.css" type="text/css"/>
        <script type="text/javascript" src="../../jquery-ui-1.7.2/jquery-1.3.2.js">
        </script>
        <script type="text/javascript" src="../../jquery-ui-1.7.2/ui/ui.core.js">
        </script>
        <script type="text/javascript" src="../../jquery-ui-1.7.2/ui/ui.accordion.js">
        </script>
        <script type="text/javascript" src="../../jquery-ui-1.7.2/ui/ui.datepicker.js">
        </script>
        <script type="text/javascript" src="../../jquery-ui-1.7.2/ui/ui.draggable.js">
        </script>
        <script type="text/javascript" src="../../jquery-ui-1.7.2/ui/ui.droppable.js">
        </script>
        <script type="text/javascript" src="../../livequery-1.0.3/jquery.livequery.js">
        </script>
        <script type="text/javascript">
            //<![CDATA[
	            $(function(){
	                $(".xroot").livequery(function(){
	                    $(this).addClass("");
	                });
	                $(".xroot, .xelement").livequery(function(){
	                    $(this).addClass("ui-accordion ui-widget ui-helper-reset");
	                });
					$(".xelement").livequery(function(){
						var q = $(this);
						var title = q.attr('title');
	                    q.addClass("ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active");
						q.before('<h3><a href="#">' + title + '</a></h3>');
					});
					$(".xattribute").livequery(function(){
						var q = $(this);
						var name =q.attr('name');
						var title =q.attr('title');
						q.append('<label for="' + name + '">' + title + '</label><input type="text" name="' + name + '"/>');
					});
					$(".xattribute[type='date']>input").livequery(function(){
						$(this).datepicker({
							dateFormat: $.datepicker.ISO_8601
						});
					});
	                $(".xroot>h3,.xelement>h3").livequery(function(){
	                    $(this).addClass("ui-accordion-header ui-helper-reset ui-state-active ui-corner-top");
						$(this).prepend('<span class="ui-icon ui-icon-plusthick"/>');
						$(this).prepend('<span class="ui-icon ui-icon-triangle-1-s"/>');
	                });
	                $("h3>span.ui-icon-triangle-1-s").livequery('click', function(){
						$(this).removeClass("ui-icon-triangle-1-s").addClass("ui-icon-triangle-1-e");
						$(this).parents(".xmlelement:first").removeClass("ui-state-active").addClass("ui-state-default");
						$(this).parents("h3:first").removeClass("ui-corner-top").addClass("ui-corner-all");
						$(this).parent().next().hide();
	                });
	                $("h3>span.ui-icon-triangle-1-e").livequery('click', function(){
						$(this).removeClass("ui-icon-triangle-1-e").addClass("ui-icon-triangle-1-s");
						$(this).parents(".xmlelement").removeClass("ui-state-default").addClass("ui-state-active");
						$(this).parents("h3:first").removeClass("ui-corner-all").addClass("ui-corner-top");
						$(this).parent().next().show();
	                });
	            });
            //]]>
        </script>
    </head>
    <body>
    	<!--
        <div class="xroot">
            <h3><a href="#">Element header</a></h3>
            <div class="xelement" title="A-Team Member" name="soldier">
            	<p class="xtext">
	            	Here is some content.            		
            	</p>
				<p class="xattribute" title="Character name" name="name">
					<label for="name"></label><input type="test" name="name"/>
				</p>
            </div>
        </div>
		-->
        <div class="xroot">
            <div class="xelement" title="A-Team Member" name="soldier">
				<div class="xattribute" title="Character name" name="name"></div>
				<div class="xattribute" title="First appearance" name="appearance" type="date"></div>
				<div class="xtext">
					Here is some content.					
				</div>
            </div>
        </div>
    </body>
</html>
