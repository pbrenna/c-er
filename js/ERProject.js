function ERProject(svg) {
    this.svg = svg
    this.states = []
    this.curState = -1
    this.nsMap = {}
    this.ns = "http://disco.unimib.it/c-er/er"
    this.vns = "http://disco.unimib.it/c-er/view"
    this.erPrefix = ""
    this.viewPrefix = ""
    this.scheduled = {}
    this.load = function(erdoc) {
        this.erPrefix = erdoc.lookupPrefix(this.ns)
        if (!this.erPrefix) {
            throw new DOMException("missing ER namespace")
        }
        this.viewPrefix = erdoc.lookupPrefix(this.vns)
        if (!this.viewPrefix) {
            throw new DOMException("missing View namespace")
        }
        this.nsMap[this.erPrefix] = this.ns
        this.nsMap[this.viewPrefix] = this.vns
        this.erdoc = erdoc
        this.addState()
    }
    this.get = function(id) {
        var el = this.erdoc.getElementById(id)
        if (el.namespaceURI != this.ns)
            return null
        return this.wrap(el)
    }
    this.wrap = function(el) {
        try {
            switch (el.localName) {
                case "entity":
                    return new Entity(new Concept(el, this))
                case "relation":
                    return new Relation(new Concept(el, this))
                case "attr":
                    return new Attr(el, this)
                case "participation":
                    return new Participation(el, this)
            }
        } catch (e) {}
        return null
    }
    this.addState = function() {
        this.curState += 1
            //console.log("prima: ", this.states)
        this.states = this.states.slice(0, this.curState)
        this.states.push(this.erdoc.cloneNode(true))
            //console.log("dopo: ", this.states)
        this.update()
    }
    this.update = function() {
        this.scheduled = {}
        for (var x in this.scheduled) {
            switch (x) {
                case "refClean":
                    this.refClean();
                    break;
            }
        }
        try {
            var pre = document.getElementById("erXmlPre")
            var seri = new XMLSerializer()
            var str = vkbeautify.xml(seri.serializeToString(this.erdoc))
            pre.innerHTML = str
        } catch (e) {

        }
        this.schema = this.erdoc.getElementsByTagNameNS(this.ns, "schema")[0]
        console.assert(this.schema != null)
        this.draw()
    }
    this.mkErElement = function(name, parent, attrDict) {
        var el = this.erdoc.createElementNS(this.ns, name)
        el.persist = {}
        var id = this.genId()
        el.setAttribute("id", id)
        for (var attr in attrDict) {
            el.setAttributeNS(this.ns, attr, attrDict[attr])
        }
        parent.appendChild(el)
        return el
    }
    this.refClean = function() {
        var path = "//*[@" + this.erPrefix + ":ref]"
        console.log(path)
        var that = this
        var xpathRes = this.erdoc.evaluate(
            path,
            this.erdoc,
            function(prefix) {
                return that.nsMap[prefix];
            },
            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
            null)
        for (var i = 0; i < xpathRes.snapshotLength; i++) {
            var el = xpathRes.snapshotItem(i)
            var ref = el.getAttributeNS(this.ns, "ref")
            if (!this.erdoc.getElementById(ref)) {
                try {
                    killNode(el)
                } catch (e) {
                    console.log("Could not remove reference: ", el, e)
                }
            }
        }
    }
    this.schedule = function(f) {
        this.scheduled[f] = true
    }

    this.genId = function() {
        this.idCount += 1
        while (document.getElementById("er" + this.idCount)) {
            this.idCount += 1
        }
        return "er" + this.idCount
    }
    this.getElId = function(el) {
        return el.getAttribute("id")
    }
    this.idCount = 0;

    this.undo = function() {
        if (this.curState > 0) {
            this.curState -= 1
            this.erdoc = this.states[this.curState].cloneNode(true)
            this.selection.s = []
            this.update()
        }
    }
    this.redo = function() {
        if (this.curState < this.states.length - 1) {
            this.curState += 1
            this.erdoc = this.states[this.curState].cloneNode(true)
            this.selection.s = []
            this.update()
        }
    }
    this.draw = function() {
        this.svgAll = document.getElementById("svg-all")
        this.svgAll.parentNode.removeChild(this.svgAll)
        var nuovo = svgEl(this.svg, "g", { "id": "svg-all" }, false)
        this.svgAll = nuovo
        var ch = this.schema.childNodes
        for (x in ch) {
            var wr = this.wrap(ch[x])
            if (wr) {
                try {
                    wr.draw(nuovo)
                } catch (e) {
                    alert("Could not draw object: " + e)
                    console.log(e)
                }
            }
        }
        this.selection.restore()

    }
    this.getViewAttr = function(el, name) {
        return el.getAttributeNS(this.vns, name)
    }
    this.setViewAttr = function(el, name, val) {
        return el.setAttributeNS(this.vns, name, val)
    }
    this.getErAttr = function(el, name) {
        return el.getAttributeNS(this.ns, name)
    }
    this.setErAttr = function(el, name, val) {
        return el.setAttributeNS(this.ns, name, val)
    }
    this.styles = {
        selectedStroke: "#f00",
        normalStroke: "#000",
        padding: 5
    }
    this.selection = {}
    this.selection.s = [] //selected elements
    this.selection.clicked = function(obj) {
        this.s.push(obj)
        obj.selectOn()
    }
    this.selection.restore = function() {
        for (var x in this.s) {
            this.s[x].selectOn()
        }
    }
}