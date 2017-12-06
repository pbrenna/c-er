/*
 * Browser
 */
var domOT = require('dom-ot')
    , gulf = require('gulf')
    , shoe = require('shoe')

// Create a new *editable* slave document (empty by default) 
var doc = new gulf.EditableDocument({
    storageAdapter: new gulf.MemoryAdapter,
    ottype: domOT
})

// Implement editor bindings 
doc._onBeforeChange = function () {/*...*/ }
doc._onChange = function () {/*...*/ }
doc._setContent = function (content) {
    erp = new ERProject(svg)
    console.log(content)
    console.log(content.attributes)
    var strxml = /*'<?xml version="1.0" encoding="UTF-8"?>' +*/ new XMLSerializer().serializeToString(content)
    console.log(strxml)
    var erdoc = new DOMParser().parseFromString(strxml, "text/xml")
    erp.load("ciao", erdoc)
    //var cb = new Callback(erp.load, erp, ["ciao"])
    //ajaxGet(name, cb, true)
    return () => { }
}


var stream = shoe('/socket')
stream.pipe(doc.masterLink()).pipe(stream)
