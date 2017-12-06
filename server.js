/*
 * Server
 */
var domOT = require('dom-ot')
  , gulf = require('gulf')
  , http = require('http')
  , shoe = require('shoe')
  , fs = require('fs')
  , xmldom = require('xmldom')

var ecstatic = require('ecstatic')(__dirname)
var server = http.createServer(ecstatic);
server.listen(8081);
  

// Create a new master document 
var doc = new gulf.Document({
 storageAdapter: new gulf.MemoryAdapter,
 ottype: domOT
})

var str = fs.readFileSync("example.er.xml").toString()
var tree = new xmldom.DOMParser().parseFromString(str)

var div = domOT.create(tree)
function print_tree(el, indent) {
    if (el != null && el.tagName != undefined){
        console.log(" ".repeat(indent*2) + el.tagName)
        for (x in el.childNodes){
            if (el.childNodes.hasOwnProperty(x)) {
                print_tree(el.childNodes[x], indent + 1)
            }
        }
    }
}
print_tree(div, 0)
doc.initializeFromStorage(div) // Optionally supply default content 

// Set up a server 

var sock = shoe(function (stream) {
    stream.pipe(doc.slaveLink()).pipe(stream);
  })
sock.install(server, '/socket');