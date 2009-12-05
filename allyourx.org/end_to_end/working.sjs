<?sjs pow_header("Content-Type:application/xhtml+xml"); ?><!DOCTYPE html SYSTEM "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
        <script type="text/javascript" src="../../jquery-ui-1.7.2/ui/ui.sortable.js">
        </script>
        <script type="text/javascript" src="../../livequery-1.0.3/jquery.livequery.js">
        </script>
        <script type="text/javascript">
        	$(function(){
				$("#accordion").accordion();
				
                var generic_str = "ui-helper-reset";
                var container_str = "ui-widget ui-accordion ui-corner-all";
                var content_str = "ui-widget-content";
                $(".xroot").livequery(function(){
                    $(this).addClass([generic_str, container_str].join(' '));
                });
                $(".xelement").livequery(function(){
                    $(this).addClass([generic_str, "ui-accordion-content ui-accordion-content-active ui-widget-content"].join(' '));
                });
                $(".xroot>h3,.xelement>h3").livequery(function(){
                    $(this).addClass([generic_str, content_str, "ui-state-active ui-corner-top"].join(' '));
                });
                $(".xattribute").livequery(function(){
                    $(this).addClass([generic_str, content_str].join(' '));
                });
                $(".xcontent").livequery(function(){
                    $(this).addClass([generic_str, content_str].join(' '));
                });
                
            });
        </script>
    </head>
    <body>
<div id="accordion">
   <h3><a href="#">Section 1</a></h3>
   <div>
      Section 1 content
   </div>
   <h3><a href="#">Section 2</a></h3>
   <div>
      Section 2 content
   </div>
   <h3><a href="#">Section 3</a></h3>
   <div>
      Section 3 content
   </div>
</div>		
    	<div class="ui-accordion ui-widget ui-helper-reset">
  <h3 class="ui-accordion-header ui-helper-reset ui-state-active ui-corner-top">
    <span class="ui-icon ui-icon-triangle-1-s"/>
    <a href="#">Section 1</a>
  </h3>
  <div class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active">
    Section 1 content
  </div>
  <h3 class="ui-accordion-header ui-helper-reset ui-state-default ui-corner-all">
    <span class="ui-icon ui-icon-triangle-1-e"/>
    <a href="#">Section 2</a>
  </h3>
  <div class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom">
    Section 2 content
  </div>
  <h3 class="ui-accordion-header ui-helper-reset ui-state-default ui-corner-all">
    <span class="ui-icon ui-icon-triangle-1-e"/>
    <a href="#">Section 3</a>
  </h3>
  <div class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom">
    Section 3 content
  </div>
</div>

<div class="xroot">
	<h3><a href="#"><span class="ui-icon ui-icon-plusthick"></span></a>All data records</h3>
	<div class="xelement">
		<h3>Element header</h3>
		<div class="xattribute">
			Attribute value
		</div>
		<div class="xcontent">
			Content value
		</div>
	</div>
</div>


    </body>
</html>
