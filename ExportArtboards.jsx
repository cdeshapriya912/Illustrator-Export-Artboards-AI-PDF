/**
 * Export Selected Artboards
 * Adobe Illustrator ExtendScript
 * 
 * Allows users to select specific artboards and export them as 
 * individual editable .ai or .pdf files.
 */

#target illustrator

function exportArtboards() {
    if (app.documents.length === 0) {
        alert("No documents open. Please open a document first.");
        return;
    }

    var doc = app.activeDocument;
    var artboards = doc.artboards;
    var artboardCount = artboards.length;

    // Build the UI Dialog
    var dialog = new Window("dialog", "Export Selected Artboards");
    dialog.orientation = "column";
    dialog.alignChildren = ["fill", "top"];
    
    // Artboard List Panel
    var panelList = dialog.add("panel", undefined, "Select Artboards to Export");
    panelList.orientation = "column";
    panelList.alignChildren = ["fill", "top"];
    
    // Checkboxes are more stable than ListBox on macOS ScriptUI
    var scrollGroup = panelList.add("group");
    scrollGroup.orientation = "column";
    scrollGroup.alignChildren = ["left", "top"];
    // Set a fixed height to enable scrolling if there are many artboards
    scrollGroup.maximumSize.height = 200;
    
    var checkboxes = [];
    for (var i = 0; i < artboardCount; i++) {
        var cb = scrollGroup.add("checkbox", undefined, (i + 1) + ": " + artboards[i].name);
        cb.value = true; // Select all by default
        cb.artboardIndex = i;
        checkboxes.push(cb);
    }
    
    // Selection Buttons
    var grpSelect = panelList.add("group");
    grpSelect.alignment = ["center", "top"];
    var btnSelectAll = grpSelect.add("button", undefined, "Select All");
    var btnSelectNone = grpSelect.add("button", undefined, "Select None");
    
    btnSelectAll.onClick = function() {
        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].value = true;
        }
    }
    btnSelectNone.onClick = function() {
        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].value = false;
        }
    }

    // Settings Panel
    var panelSettings = dialog.add("panel", undefined, "Export Settings");
    panelSettings.orientation = "column";
    panelSettings.alignChildren = ["fill", "top"];

    // Format Radio Buttons
    var grpFormat = panelSettings.add("group");
    grpFormat.orientation = "row";
    grpFormat.add("statictext", undefined, "Format:");
    var rbAI = grpFormat.add("radiobutton", undefined, "AI (.ai)");
    var rbPDF = grpFormat.add("radiobutton", undefined, "PDF (.pdf)");
    rbAI.value = true; // Default AI
    
    // Output Folder Selection
    var grpFolder = panelSettings.add("group");
    grpFolder.orientation = "row";
    grpFolder.alignChildren = ["left", "center"];
    var btnFolder = grpFolder.add("button", undefined, "Choose Output Folder...");
    var lblFolder = grpFolder.add("statictext", undefined, "No folder selected", {truncate: "middle"});
    lblFolder.characters = 30;
    
    // Try to get document path as default folder, fallback to desktop
    var defaultFolder = null;
    try {
        defaultFolder = doc.path;
    } catch (e) {
        defaultFolder = Folder.desktop;
    }
    
    var outputFolder = defaultFolder;
    if (outputFolder) {
        lblFolder.text = outputFolder.fsName;
    }

    btnFolder.onClick = function() {
        var f = Folder.selectDialog("Select Output Folder", outputFolder);
        if (f) {
            outputFolder = f;
            lblFolder.text = f.fsName;
        }
    }

    // Action Buttons
    var grpActions = dialog.add("group");
    grpActions.alignment = ["right", "top"];
    var btnCancel = grpActions.add("button", undefined, "Cancel", {name: "cancel"});
    var btnExport = grpActions.add("button", undefined, "Export", {name: "ok"});
    
    btnExport.onClick = function() {
        if (!outputFolder) {
            alert("Please select an output folder.");
            return;
        }
        
        var hasSelection = false;
        for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].value) {
                hasSelection = true;
                break;
            }
        }
        
        if (!hasSelection) {
            alert("Please select at least one artboard to export.");
            return;
        }
        
        dialog.close(1);
    }
    
    if (dialog.show() === 1) {
        try {
            var docName = doc.name;
            var extIndex = docName.lastIndexOf(".");
            if (extIndex !== -1) {
                docName = docName.substring(0, extIndex);
            }
            if (!docName) docName = "Untitled";
            
            var isAI = rbAI.value;
            var fileExt = isAI ? ".ai" : ".pdf";
            
            // Build range string and calculate exported count
            var ranges = [];
            var exportedCount = 0;
            for (var i = 0; i < checkboxes.length; i++) {
                if (checkboxes[i].value) {
                    ranges.push(i + 1); // 1-based index for artboardRange
                    exportedCount++;
                }
            }
            var rangeString = ranges.join(",");
            
            // Base destination file
            // Note: Illustrator will automatically append "_ArtboardName" when saving multiple artboards as AI
            var destFile = new File(outputFolder.fsName + "/" + docName + fileExt);
            
            if (isAI) {
                var saveOptions = new IllustratorSaveOptions();
                saveOptions.saveMultipleArtboards = true;
                saveOptions.artboardRange = rangeString;
                
                // Save As (batch saves multiple AI files)
                doc.saveAs(destFile, saveOptions);
            } else {
                // To export an editable PDF that ONLY contains the target artboard and visible layers,
                // we must duplicate the document, clean it up, and save it.
                var originalFile = null;
                try { originalFile = new File(doc.fullName); } catch(e) {}
                
                if (!originalFile || !originalFile.exists) {
                    alert("Please SAVE your document once before exporting editable PDFs so it can be duplicated.");
                    return;
                }
                
                var tempFile = new File(Folder.temp.fsName + "/temp_export_artboards_" + new Date().getTime() + ".ai");
                originalFile.copy(tempFile);
                
                for (var i = 0; i < checkboxes.length; i++) {
                    if (checkboxes[i].value) {
                        var abIndex = checkboxes[i].artboardIndex;
                        var abName = artboards[abIndex].name.replace(/[\\\/\:\*\?\"\<\>\|]/g, "_");
                        var pdfDestFile = new File(outputFolder.fsName + "/" + docName + "_" + abName + ".pdf");
                        
                        // Open the temp file for this specific artboard
                        var tempDoc = app.open(tempFile);
                        
                        // 1. Delete all other artboards
                        for (var j = tempDoc.artboards.length - 1; j >= 0; j--) {
                            if (j !== abIndex) {
                                tempDoc.artboards[j].remove();
                            }
                        }
                        
                        // 2. Delete all hidden layers to fulfill "visible layer only"
                        for (var k = tempDoc.layers.length - 1; k >= 0; k--) {
                            if (!tempDoc.layers[k].visible) {
                                // Unlock layer to ensure it can be deleted
                                tempDoc.layers[k].locked = false;
                                tempDoc.layers[k].remove();
                            }
                        }
                        
                        // 3. Delete artwork outside the remaining artboard
                        tempDoc.artboards.setActiveArtboardIndex(0); // Only one artboard left
                        
                        // Unlock all remaining layers so we can process items
                        for (var k = 0; k < tempDoc.layers.length; k++) {
                            tempDoc.layers[k].locked = false;
                        }
                        
                        app.executeMenuCommand("deselectall");
                        app.executeMenuCommand("unlockAll"); // Unlock all items
                        
                        // Select everything on the target artboard
                        tempDoc.selectObjectsOnActiveArtboard();
                        
                        // Lock the items that we want to keep
                        if (tempDoc.selection.length > 0) {
                            for (var m = 0; m < tempDoc.selection.length; m++) {
                                tempDoc.selection[m].locked = true;
                            }
                        }
                        
                        app.executeMenuCommand("deselectall");
                        
                        // Select everything else (outside the artboard)
                        app.executeMenuCommand("selectall");
                        
                        // Delete the outside items
                        if (tempDoc.selection.length > 0) {
                            var outsideItems = tempDoc.selection;
                            for (var m = outsideItems.length - 1; m >= 0; m--) {
                                try {
                                    outsideItems[m].remove();
                                } catch(e) {}
                            }
                        }
                        
                        // Unlock the kept items
                        app.executeMenuCommand("unlockAll");
                        app.executeMenuCommand("deselectall");
                        
                        // Save as PDF with preserveEditability = TRUE
                        var saveOptions = new PDFSaveOptions();
                        saveOptions.preserveEditability = true; 
                        
                        tempDoc.saveAs(pdfDestFile, saveOptions);
                        tempDoc.close(SaveOptions.DONOTSAVECHANGES);
                    }
                }
                
                // Cleanup temp file
                if (tempFile.exists) {
                    tempFile.remove();
                }
            }
            
            alert("Export complete!\n" + exportedCount + " artboard(s) successfully exported to:\n" + outputFolder.fsName);
        } catch (e) {
            alert("An error occurred during export (Line " + e.line + "):\n" + e.message);
        }
    }
}

exportArtboards();
