"use strict";

function ERProject(svg) {
    this.svg = svg
    this.states = []
    this.curState = -1
    this.nsMap = {}
    this.ns = "http://pbrenna.github.io/c-er/ns/er"
    this.vns = "http://pbrenna.github.io/c-er/ns/view"
    this.erPrefix = ""
    this.viewPrefix = ""
    this.scheduled = []
    this.zoom = 1
    this.grid = 20
    var that = this
    this.load = function(erdoc) {
        this.erPrefix = erdoc.lookupPrefix(this.ns, "er")
        if (!this.erPrefix) {
            throw new Error("missing ER namespace")
        }
        //this.viewPrefix = erdoc.lookupPrefix(this.vns)
        //if (!this.viewPrefix) {
        //    throw new Error("missing View namespace")
        //}
        this.nsMap[this.erPrefix] = this.ns
            //this.nsMap[this.viewPrefix] = this.vns
        this.erdoc = erdoc
        this.addState()
        this.applyZoom()
        this.selectPanel("Creation")
        this.saved = true
    }
    this.getById = function(id) {
        var el = this.erdoc.getElementById(id)
        if (!el)
            el = this.erdoc.querySelector('[id="' + id + '"]')
        if (!el || el.namespaceURI != this.ns)
            return null
        return el
    }
    this.get = function(id) {
        return this.wrap(this.getById(id))
    }
    this.wrap = function(el) {
        try {
            switch (el.localName) {
                case "entity":
                    return new Entity(el, this)
                case "relationship":
                    return new Relationship(el, this)
                case "attr":
                    return new Attr(el, this)
                case "participation":
                    return new Participation(el, this)
                case "generalization":
                    return new Generalization(el, this)
                case "is-a":
                    return new IsA(el, this)
            }
        } catch (e) {}
        return null
    }
    this.addState = function(dontUpdate) {
        this.curState += 1
            //console.log("prima: ", this.states)
        this.states = this.states.slice(0, this.curState)
        this.states.push(this.erdoc.cloneNode(true))
            //console.log("dopo: ", this.states)
        if (!dontUpdate)
            this.update()
    }
    this.patchState = function(statenum, dontUpdate) {
        if (statenum == this.curState + 1) {
            this.addState()
        } else if (statenum == this.curState) {
            this.states[statenum] = this.erdoc.cloneNode(true)
        }
        if (!dontUpdate)
            this.update()
    }
    this.update = function() {
        this.saved = false
        if (this.refCleanScheduled) {
            this.refClean()
            this.patchState(this.curState, true)
            this.refCleanScheduled = false
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
        for (var x in this.scheduled) {
            var cb = this.scheduled[x]
            cb.exec()
        }
        this.scheduled = []
        this.resizeSvg()
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
        var path = "//@*[starts-with(local-name(), 'ref')]"
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
            var ref = el.nodeValue
            if (!this.getById(ref)) {
                try {
                    killNode(el.ownerElement)
                } catch (e) {
                    console.log("Could not remove reference: ", el, e)
                }
            }
        }
    }
    this.scheduleDraw = function(cb) {
        this.scheduled.push(cb)
    }

    this.genId = function() {
        this.idCount += 1
        while (this.erdoc.getElementById("er" + this.idCount)) {
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
            this.selection.deselectAll()
            this.update()
        }
    }
    this.redo = function() {
        if (this.curState < this.states.length - 1) {
            this.curState += 1
            this.erdoc = this.states[this.curState].cloneNode(true)
            this.selection.deselectAll()
            this.update()
        }
    }
    this.draw = function() {
        this.svgAll = document.getElementById("svg-all")
        clearElement(this.svgAll)

        //
        //this.svgAll.parentNode.removeChild(this.svgAll)
        //var nuovo = svgEl(this.svg, "g", { "id": "svg-all" }, false)
        var ch = this.schema.childNodes
        for (var x = 0; x < ch.length; x++) {
            var wr = this.wrap(ch[x])
            if (wr) {
                try {
                    wr.draw(this.svgAll)
                } catch (e) {
                    alert("Could not draw object: " + e)
                    console.log(e)
                }
            }
        }
        /*var part = this.schema.getElementsByTagNameNS(this.ns, "participation")
        for (var i = 0; i < part.length; i++) {
            var p = this.wrap(part[i])
            p.draw(this.svgAll)
        }*/
        this.selection.restore()

    }
    this.getViewAttr = function(el, name) {
        try {
            return el.getAttributeNS(this.vns, name)
        } catch (e) {
            return null
        }
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
        selectedStroke: "#d00",
        normalStroke: "#000",
        defaultFont: "Arial,sans-serif",
        defaultFontSize: "14",
        generalization: {
            height: 140,
            margin: 20,
            horizHeight: 100,
            belowHorizHeight: 60
        },
        entity: {
            padding: 5,
            defaultH: 40,
            defaultW: 140,
            corners: 25,
            attrSpacing: 25,
            attrLineH: 15,
            attrCircRad: 4,
            primaryFill: "#000",
            attrOffset: 4,
            attrDist: 10,
            attrFontSize: 12,
            attrRotationDeg: -40
        },
        relationship: {
            defaultH: 60,
            defaultW: 180,
            corners: 40,
            padding: 20,
            attrSpacing: 25,
            attrLineH: 30,
            attrCircRad: 4,
            primaryFill: "#000",
            attrOffset: 4,
            attrDist: 10,
            attrFontSize: 12,
            attrRotationDeg: -40
        }
    }
    this.selection = {}

    this.selection.s = [] //selected elements
    this.selection.clicked = function(obj, ev) {
        var ind = -1;
        if (!ev.shiftKey) {
            this.deselectAll()
        }
        if (this.s.indexOf(obj.getId()) < 0) {
            this.s.push(obj.getId())
            obj.selectOn()
            that.selectionChanged()
        }
    }
    this.selection.set = function(list) {
        this.deselectAll()
        this.s = list
        that.selectionChanged()
        this.restore()
    }
    this.selection.restore = function() {
        for (var x in this.s) {
            that.get(this.s[x]).selectOn()
        }
    }
    this.selection.deselectAll = function() {
        for (var x in this.s) {
            try {
                that.get(this.s[x]).selectOff()
            } catch (e) {}
        }
        this.s = []
        that.selectionChanged()
    }
    this.selection.selected = function(obj) {
        return this.s.indexOf(obj.getId()) >= 0
    }
    this.svg.addEventListener("click", function(ev) {
        var target = ev.target || ev.srcElement
        if (target == svg) {
            that.selection.deselectAll()
        } else {
            that.exitInsertMode()
        }
        if (that.curInsertMode) {
            that.curInsertMode(ev)
            that.exitInsertMode()
        }
    })
    this.curInsertMode = null
    this.exitInsertMode = function() {
        var buttons = document.getElementsByClassName("insertMode")
        for (var x = 0; x < buttons.length; x++) {
            buttons[x].className = "insertMode"
        }
        this.curInsertMode = null
    }
    this.toggleInsertMode = function(button, func) {
        var buttons = document.getElementsByClassName("insertMode")
        for (var x = 0; x < buttons.length; x++) {
            buttons[x].className = "insertMode"
        }
        if (func == this.curInsertMode) {
            this.curInsertMode = null
        } else {
            this.curInsertMode = func
            button.className = "insertMode on"
            this.selection.deselectAll()
        }
    }
    this.getMouseInDocument = function(ev) {
        return { x: ev.layerX, y: ev.layerY }
    }
    this.dragStart = function(obj, ev) {
        if (!this.selection.selected(obj)) {
            this.selection.clicked(obj, ev)
        }
        dragging = []
        for (var x in this.selection.s) {
            var obj = this.get(this.selection.s[x])
            obj.addStateNumber = this.curState + 1
            obj.startX = ev.clientX
            obj.startY = ev.clientY
            obj.dragX = true
            obj.dragY = true
            dragging.push(obj)
        }
    }
    this.selectionChanged = function() {
        if (this.selection.s.length == 1) {
            var id = this.selection.s[0]
            var type = this.get(id).type
            this.selectPanel(type)
        } else if (this.selection.s.length == 0) {
            this.selectPanel("Creation")
        } else {
            this.selectPanel("MultipleSelection")
            var b1 = document.getElementById("addParticipation")
            var b2 = document.getElementById("addGeneralization")
            var b3 = document.getElementById("addIsA")
            b1.setAttribute("disabled", "true")
            b2.setAttribute("disabled", "true")
            b3.setAttribute("disabled", "true")
            if (this.canAddParticipation()) {
                try { b1.removeAttribute("disabled") } catch (e) {}
            }
            if (this.canAddGeneralization()) {
                try { b2.removeAttribute("disabled") } catch (e) {}
            }
            if (this.canAddIsA()) {
                try { b3.removeAttribute("disabled") } catch (e) {}
            }
        }
    }
    this.selectPanel = function(name) {
        var panels = document.getElementsByClassName("panel")
        switch (name) {
            case "Entity":
                updateEntityPanel();
                break;
            case "Relationship":
                updateRelationshipPanel();
                break;
            case "Participation":
                updateParticipationPanel();
                break;
        }
        for (var p = 0; p < panels.length; p++) {
            panels[p].className = "panel"
        }
        document.getElementById("panel" + name).className = "panel visible"
    }
    this.deleteSelection = function() {
        for (var x in this.selection.s) {
            var obj = this.get(this.selection.s[x])
            obj.destroy()
        }
        this.selection.deselectAll()
        this.addState()
    }
    this.applyZoom = function() {
        this.svgAll.transform.baseVal.getItem(0).setScale(this.zoom, this.zoom)
        scroller.style.fontSize = 20 * this.zoom + "px"
        this.resizeSvg()
    }
    this.zoomIn = function() {
        this.zoom *= 1.25
        this.applyZoom()
    }
    this.zoomOut = function() {
        this.zoom /= 1.25
        this.applyZoom()
    }
    this.resizeSvg = function() {
        var bbox = this.svgAll.getBoundingClientRect()
        var outf = document.getElementById('outerFixed')
        var minw = outf.clientWidth - 12
        var minh = outf.clientHeight - 12
        var w = max((bbox.width + bbox.left) * 1 + scroller.scrollLeft, minw)
        var h = max((bbox.height + bbox.top) * 1 + scroller.scrollTop, minh)
        this.svg.setAttribute("width", w)
        this.svg.setAttribute("height", h)
    }
    this.saveFile = function() {
        var xml = vkbeautify.xml(new XMLSerializer().serializeToString(this.erdoc))
        this.saved = true
        download(xml, "project.er.xml", "text/xml")
    }
    this.saveSVG = function() {
        this.selection.deselectAll()
        var xml = new XMLSerializer().serializeToString(this.svg)
        download(xml, "project.er.svg", "image/svg+xml")
    }
    this.saveImg = function() {
        var canvas = document.getElementById("canvas")
        var img = new Image()
        this.selection.deselectAll()
        img.crossOrigin = 'anonymous'
        var oldzoom = this.zoom
        this.zoom = 1
        this.applyZoom()
        var svg2 = this.svg.cloneNode(true)
        var svgallNew = svg2.getElementById('svg-all')
        var bbox = this.svgAll.getBoundingClientRect()
        svg2.setAttribute("height", bbox.height)
        svg2.setAttribute("width", bbox.width)
        this.zoom = oldzoom
        this.applyZoom()
        console.log(bbox)
        svgallNew.transform.baseVal.getItem(0).setTranslate(-bbox.left - scroller.scrollLeft, -bbox.top - scroller.scrollTop)
        var xml = new XMLSerializer().serializeToString(svg2)
        canvas.width = bbox.width
        canvas.height = bbox.height
        img.src = "data:image/svg+xml;base64," + btoa(xml)
        var ctx = canvas.getContext('2d')
        img.onload = function() {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(function(blob) {
                download(blob, "project.er.png", "image/png")
            }, "image/png", 1)
        }
    }
    this.canAddParticipation = function() {
        if (this.selection.s.length != 2)
            return false
        var types = [this.get(this.selection.s[0]).type,
            this.get(this.selection.s[1]).type
        ]
        return types.indexOf("Entity") >= 0 && types.indexOf("Relationship") >= 0
    }
    this.addParticipation = function() {
        if (this.canAddParticipation()) {
            newParticipation(this.get(this.selection.s[0]), this.get(this.selection.s[1]))
        }
    }
    this.addGeneralization = function() {
        if (this.canAddGeneralization()) {
            var objs = []
            for (var x in this.selection.s) {
                objs.push(this.get(this.selection.s[x]))
            }
            newGeneralization(objs)
        }
    }

    this.zoomedScroll = function() {
        return [scroller.scrollLeft / this.zoom, scroller.scrollTop / this.zoom]
    }
    this.canAddGeneralization = function() {
        for (var x in this.selection.s) {
            var el = this.get(this.selection.s[x])
            if (el.type != "Entity")
                return false
            if (x != 0 && !el.isFree)
                return false
        }
        return true
    }
    this.alignToGrid = function(x, y) {
        return [
            Math.round(x / this.grid) * this.grid,
            Math.round(y / this.grid) * this.grid
        ]
    }
    this.canAddIsA = function() {
        if (this.selection.s.length != 2)
            return false
        var e1 = this.get(this.selection.s[0]),
            e2 = this.get(this.selection.s[1])
        return e1.type == "Entity" && e2.type == "Entity"
    }
    this.addIsA = function() {
        if (this.canAddIsA()) {
            newIsA(this.get(this.selection.s[0]), this.get(this.selection.s[1]))
        }
    }
}