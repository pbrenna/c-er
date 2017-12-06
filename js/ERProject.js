"use strict";
/*
 * ERProject.js
 * This file is part of c-er
 *
 * Copyright (C) 2017 - Pietro Brenna
 *
 * c-er is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * c-er is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with c-er. If not, see <http://www.gnu.org/licenses/>.
 */


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
    this.grid = 20
    this.zoom = 1
    this.pname = "project"
    var that = this
    this.load = function(prname, erdoc) {
        if (prname)
            this.pname = prname
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
        this.zoom = 1
        this.svgAll = document.getElementById("svg-all")
        this.applyZoom()
        this.addState()
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
                case "note":
                    return new Note(el, this)
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
            this.checkConsistency()
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
        this.resizeSvg()
    }
    this.mkErElement = function(name, parent, attrDict, dontAppend) {
        var el = this.erdoc.createElementNS(this.ns, name)
        el.persist = {}
        var id = this.genId()
        el.setAttribute("id", id)
        for (var attr in attrDict) {
            el.setAttributeNS(this.ns, attr, attrDict[attr])
        }
        if (!dontAppend)
            parent.appendChild(el)
        return el
    }
    this.checkConsistency = function() {
        var ch = this.schema.childNodes
        for (var x = 0; x < ch.length; x++) {
            var wr = this.wrap(ch[x])
            if (wr) {
                wr.checkConsistency()
            }
        }
    }
    this.refClean = function() {
        //var path = "//@*[starts-with(local-name(), 'ref')]"
        //xpath can't be used because of internet explorer :(
        var that = this
        var all = this.erdoc.getElementsByTagNameNS(this.ns, "*")
        for (var x = 0; x < all.length; x++) {
            var el = all[x]
            var attrs = el.attributes
            if (attrs) {
                for (var y = 0; y < attrs.length; y++) {
                    var a = attrs.item(y)
                    if (a.localName.indexOf('ref') == 0) {
                        var refId = attrs[y].value
                        if (!this.get(refId)) {
                            killNode(el)
                        }
                    }
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
                //this.selection.deselectAll()
            this.selectionChanged()
            this.update()
        }
    }
    this.redo = function() {
        if (this.curState < this.states.length - 1) {
            this.curState += 1
            this.erdoc = this.states[this.curState].cloneNode(true)
                //this.selection.deselectAll()
            this.selectionChanged()
            this.update()
        }
    }
    this.draw = function() {
        clearElement(this.svgAll)
        clearElement(this.svg.getElementById("defs"))

        //
        //this.svgAll.parentNode.removeChild(this.svgAll)
        //var nuovo = svgEl(this.svg, "g", { "id": "svg-all" }, false)
        var ch = this.schema.childNodes
        for (var x = 0; x < ch.length; x++) {
            var wr = this.wrap(ch[x])
            console.log("oggetto strano:", ch[x])
            if (wr) {
                try {
                    wr.draw(this.svgAll)
                } catch (e) {
                    alert("Could not draw object: " + e)
                    console.log(e)
                }
            } else {
            }
        }
        /*var part = this.schema.getElementsByTagNameNS(this.ns, "participation")
        for (var i = 0; i < part.length; i++) {
            var p = this.wrap(part[i])
            p.draw(this.svgAll)
        }*/
        for (var x in this.scheduled) {
            var cb = this.scheduled[x]
            cb.exec()
        }
        this.scheduled = []
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
        selectedStroke: "#187c5a",
        normalStroke: "#555",
        defaultFont: "Arial,sans-serif",
        defaultFontSize: 16,
        defaultStrokeWidth: 1,
        selectedStrokeWidth: 3,
        generalization: {
            height: 140,
            margin: 20,
            horizHeight: 100,
            belowHorizHeight: 60,
        },
        lines: {
            defaultStrokeWidth: 2,
            selectedStrokeWidth: 3.5
        },
        entity: {
            padding: 5,
            defaultH: 41,
            defaultW: 139,
            corners: 25,
            attrSpacing: 25,
            attrLineH: 15,
            attrCircRad: 4,
            primaryFill: "#555",
            attrOffset: 4,
            attrDist: 10,
            attrFontSize: 14,
            attrRotationDeg: -40
        },
        relationship: {
            defaultH: 60,
            defaultW: 160,
            corners: 40,
            padding: 20,
            attrSpacing: 25,
            attrLineH: 30,
            attrCircRad: 4,
            primaryFill: "#555",
            attrOffset: 4,
            attrDist: 10,
            attrFontSize: 14,
            attrRotationDeg: -40
        },
        participation: {
            fontSize: 14
        },
        note: {
            padding: 5,
            fontSize: 14
        }
    }
    this.selection = {}

    this.selection.s = [] //selected elements
    this.selection.clicked = function(obj, ev) {
        if (!ev.shiftKey && !ev.touches) {
            this.deselectAll()
        }
        if (!this.selected(obj)) {
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
            var obj = that.get(this.s[x])
            if (obj)
                obj.selectOn()
        }
    }
    this.selection.deselectId = function(id) {
        var pos = this.s.indexOf(id)
        if (pos >= 0) {
            this.s.splice(pos, 1)
        }
        that.selectionChanged()
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
    this.selection.getFirst = function() {
        return that.get(this.s[0])
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
        return { x: ev.layerX / this.zoom, y: ev.layerY / this.zoom }
    }
    this.dragStart = function(obj, ev) {
        if (!this.selection.selected(obj)) {
            this.selection.clicked(obj, ev)
        }
        dragging = []
        var cx = ev.clientX || ev.touches[0].clientX
        var cy = ev.clientY || ev.touches[0].clientY
        for (var x in this.selection.s) {
            var obj = this.get(this.selection.s[x])
            if (obj.moveRelXY) {
                obj.addStateNumber = this.curState + 1
                obj.startX = cx
                obj.startY = cy
                obj.actuallyMoved = false
                dragging.push(obj)
            }
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
            case "Generalization":
                updateGeneralizationPanel();
                break;
            case "Note":
                updateNotePanel();
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
        download(xml, this.pname + ".er.xml", "text/xml")
    }
    this.saveSVG = function() {
        this.selection.deselectAll()
        var xml = new XMLSerializer().serializeToString(this.svg)
        download(xml, this.pname + ".er.svg", "image/svg+xml")
    }
    this.saveImg = function() {
        var canvas = document.getElementById("canvas")
        var img = new Image()
        this.selection.deselectAll()
        img.crossOrigin = 'anonymous'
            /*var oldzoom = this.zoom
            this.zoom = 1
            this.applyZoom()*/
        var svg2 = this.svg.cloneNode(true)
        var svgallNew = svg2.getElementById('svg-all')
        var bbox = this.svgAll.getBoundingClientRect()
        svg2.setAttribute("height", bbox.height)
        svg2.setAttribute("width", bbox.width)
            /*this.zoom = oldzoom
            this.applyZoom()*/
        var tr = svg2.createSVGTransform()
        var scr = this.zoomedScroll()
        tr.setTranslate(-bbox.left / this.zoom - scr[0], -bbox.top / this.zoom - scr[1])
        svgallNew.transform.baseVal.appendItem(tr)
        var xml = new XMLSerializer().serializeToString(svg2)
        canvas.width = bbox.width
        canvas.height = bbox.height
        img.src = "data:image/svg+xml;base64," + b64EncodeUnicode(xml)
        var ctx = canvas.getContext('2d')
        var that = this
        if (bbox.width < 1 || bbox.height < 1) {
            alert("Nothing to draw")
            return
        }
        img.onload = function() {
            ctx.beginPath();
            ctx.rect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            if (canvas.toBlob) {
                canvas.toBlob(function(blob) {
                    download(blob, that.pname + ".er.png", "image/png")
                }, "image/png", 1)
            } else {
                try {
                    var blob = canvas.msToBlob()
                    window.navigator.msSaveBlob(blob, that.pname + '.er.png')
                } catch (e) {
                    var d = document.createElement("div")
                    d.className = "popupWindow"
                    var el = document.createElement("span")
                    var i = document.createElement("img")
                    i.src = img.src
                    i.crossOrigin = 'Anonymous'
                    i.style.maxWidth = "100%"
                    i.style.maxHeight = "80%"
                    el.innerHTML = "Right click on the image and select 'save as PNG'.<br/><br/>"
                    d.appendChild(el)
                    d.appendChild(i)
                    document.getElementById("dim").style.display = 'block'
                    var c = document.createElement("a")
                    c.href = "#"
                    c.id = "closeDialog"
                    c.innerHTML = "Close"
                    c.addEventListener("click", function(ev) {
                        ev.preventDefault()
                        document.getElementById("dim").style.display = 'none'
                        document.body.removeChild(d)
                    })
                    d.appendChild(c)
                    document.body.appendChild(d)

                }
            }
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

    this.zoomedScroll = function() {
        return [scroller.scrollLeft / this.zoom, scroller.scrollTop / this.zoom]
    }
    this.alignToGrid = function(x, y) {
        return [
            Math.round(x / this.grid) * this.grid,
            Math.round(y / this.grid) * this.grid
        ]
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
    this.canAddGeneralization = function() {
        for (var x in this.selection.s) {
            var el = this.get(this.selection.s[x])
            if (el.type != "Entity")
                return false
            if (x != 0 && !el.isFree())
                return false
        }
        return true
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