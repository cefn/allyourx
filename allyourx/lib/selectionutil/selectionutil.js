var createSelectionUtil = function(win){
    var markerTextChar = "\ufeff";
    var markerTextCharEntity = "&#xfeff;";
    var api = {
        saveRestoreSupported: false
    };
    var doc;
    var getSelection, getSelectionInfo, insertRangeBoundaryMarker, setRangeBoundary, removeMarkerElement;
    var createRange, selectRange;
    var createSelectionInfo;
    var testSelection, testRange, testNode;
    function isHostMethod(object, property){
        var t = typeof object[property];
        return t === 'function' || (!!(t === 'object' && object[property])) || t === 'unknown';
    }
    function isHostObject(object, property){
        return !!(typeof(object[property]) === 'object' && object[property]);
    }
    function areHostMethods(object, properties){
        for (var i = properties.length; i--;) {
            if (!isHostMethod(object, properties[i])) {
                return false;
            }
        }
        return true;
    }
    function areHostObjects(object, properties){
        for (var i = properties.length; i--;) {
            if (!isHostObject(object, properties[i])) {
                return false;
            }
        }
        return true;
    }
    if (isHostObject(win, "document")) {
        doc = win.document;
        if (isHostMethod(win, "getSelection")) {
            getSelection = function(){
                return win.getSelection();
            };
        }
        else 
            if (isHostObject(win.document, "selection")) {
                getSelection = function(){
                    return win.document.selection;
                };
            }
        if (getSelection) {
            api.getSelection = getSelection;
            if (isHostMethod(doc, "createRange")) {
                createRange = function(){
                    return doc.createRange();
                };
            }
            else 
                if (isHostMethod(doc.body, "createTextRange")) {
                    createRange = function(){
                        return doc.body.createTextRange();
                    };
                }
            if (createRange) {
                api.createRange = createRange;
                createSelectionInfo = function(range, isDomRange){
                    return {
                        range: range,
                        isDomRange: isDomRange
                    };
                };
                testSelection = getSelection();
                testRange = createRange();
                if (isHostMethod(testSelection, "getRangeAt")) {
                    getSelectionInfo = function(selection){
                        var range = (selection.rangeCount === 0) ? null : selection.getRangeAt(0);
                        return createSelectionInfo(range, true);
                    };
                }
                else 
                    if (isHostMethod(testSelection, "createRange")) {
                        getSelectionInfo = function(selection){
                            var textRange = selection.createRange();
                            return createSelectionInfo(textRange, false);
                        };
                    }
                    else 
                        if (areHostObjects(testSelection, ["anchorNode", "focusNode", "anchorOffset", "focusOffset", "isCollapsed"]) && createRange && isHostObject(createRange(), "collapsed")) {
                            getSelectionInfo = function(selection){
                                var range = doc.createRange();
                                range.setStart(selection.anchorNode, selection.anchorOffset);
                                range.setEnd(selection.focusNode, selection.focusOffset);
                                if (range.collapsed !== selection.isCollapsed) {
                                    range.setStart(selection.focusNode, selection.focusOffset);
                                    range.setEnd(selection.anchorNode, selection.anchorOffset);
                                }
                                return createSelectionInfo(range, true);
                            };
                        }
                if (getSelectionInfo) {
                    api.getSelectionInfo = getSelectionInfo;
                }
                if (areHostMethods(testSelection, ["removeAllRanges", "addRange"])) {
                    selectRange = function(selection, range){
                        selection.removeAllRanges();
                        selection.addRange(range);
                    };
                }
                else 
                    if (isHostMethod(testSelection, ["empty"]) && isHostMethod(testRange, ["select"])) {
                        selectRange = function(selection, range){
                            selection.empty();
                            range.select();
                        };
                    }
                if (selectRange) {
                    api.selectRange = selectRange;
                    if (areHostMethods(doc, ["getElementById", "createElement", "createTextNode"])) {
                        testNode = doc.createElement("span");
                        if (areHostMethods(testNode, ["appendChild", "removeChild"])) {
                            if (areHostMethods(testRange, ["collapse", "insertNode", "setStartAfter", "setEndBefore", "cloneRange", "detach"]) || areHostMethods(testRange, ["collapse", "pasteHTML", "setEndPoint", "moveToElementText", "duplicate"])) {
                                insertRangeBoundaryMarker = function(selectionInfo, atStart){
                                    var markerId = "selectionBoundary_" + new Date().getTime() + "_" + Math.random().toString().substr(2);
                                    var range, markerEl;
                                    if (selectionInfo.isDomRange) {
                                        range = selectionInfo.range.cloneRange();
                                        range.collapse(atStart);
                                        markerEl = doc.createElement("span");
                                        markerEl.id = markerId;
                                        markerEl.appendChild(doc.createTextNode(markerTextChar));
                                        range.insertNode(markerEl);
                                        selectionInfo.range[atStart ? "setStartAfter" : "setEndBefore"](markerEl);
                                        range.detach();
                                    }
                                    else {
                                        range = selectionInfo.range.duplicate();
                                        range.collapse(atStart);
                                        range.pasteHTML('<span id="' + markerId + '">' + markerTextCharEntity + '</span>');
                                        markerEl = doc.getElementById(markerId);
                                        range.moveToElementText(markerEl);
                                        selectionInfo.range.setEndPoint(atStart ? "StartToEnd" : "EndToStart", range);
                                    }
                                    return markerId;
                                };
                                setRangeBoundary = function(range, markerId, isDomRange, atStart){
                                    var markerEl = doc.getElementById(markerId);
                                    var tempRange;
                                    if (isDomRange) {
                                        range[atStart ? "setStartAfter" : "setEndBefore"](markerEl);
                                    }
                                    else {
                                        tempRange = range.duplicate();
                                        tempRange.moveToElementText(markerEl);
                                        range.setEndPoint(atStart ? "StartToEnd" : "EndToStart", tempRange);
                                    }
                                    markerEl.parentNode.removeChild(markerEl);
                                };
                                api.removeMarkerElement = function(markerId){
                                    var markerEl = doc.getElementById(markerId);
                                    markerEl.parentNode.removeChild(markerEl);
                                };
                                api.saveSelection = function(){
                                    var selectionInfo = getSelectionInfo(getSelection());
                                    var savedSelection = {
                                        startMarkerId: insertRangeBoundaryMarker(selectionInfo, true),
                                        endMarkerId: insertRangeBoundaryMarker(selectionInfo, false),
                                        isDomRange: selectionInfo.isDomRange
                                    };
                                    selectRange(getSelection(), selectionInfo.range);
                                    return savedSelection;
                                };
                                api.restoreSelection = function(savedSelection){
                                    var range = createRange();
                                    setRangeBoundary(range, savedSelection.startMarkerId, savedSelection.isDomRange, true);
                                    setRangeBoundary(range, savedSelection.endMarkerId, savedSelection.isDomRange, false);
                                    selectRange(getSelection(), range);
                                };
                                api.removeMarkers = function(savedSelection){
                                    removeMarkerElement(savedSelection.startMarkerId);
                                    removeMarkerElement(savedSelection.endMarkerId);
                                };
                                api.saveRestoreSupported = true;
                            }
                        }
                    }
                }
            }
        }
    }
    return api;
};
