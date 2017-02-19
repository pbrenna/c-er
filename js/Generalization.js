"use strict";

function Generalization(node, project) {
    Concept.apply(this, [node, project])
    this.node = node
    this.type = "Generalization"
    var p = this.project
    this.destroy = function() {
        //destruction frees entities from the generalization
        //in general it is good to move them somewhat
        //to prevent them from being stuck under other entities
        //that were on the right of the generalization tree;
        //moving them up (z) would be bad because it would cover
        //the remaining generalization lines and increase confusion
        var pa = this.getParent()
        if (pa) {
            var pCenter = pa.getCenter()
            pa.setXY(pCenter[0], pCenter[1] + p.grid)
            this.node.parentNode.insertBefore(pa.node, this.node) //might be another generalization
        }
        var ch = this.getChildren()
        if (ch) {
            for (var x in ch) {
                this.setFree(ch[x])
            }
        }
        //then copy super's destructor
        this.project.selection.deselectId(this.getId())
        killNode(this.node)
        this.project.refCleanScheduled = true
        this.node = null
    }
    this.getName = function() {
        return this.getParent().getName()
    }
    this.setXY = function(x, y) {
        //a generalization does not have a position itself:
        //instead, it relies on the position of its parent concept.
        this.getParent().setXY(x, y)
    }
    this.getXY = function() {
        return this.getParent().getXY()
    }
    this.getReservedSlotXY = function(n, pos) {
        return this.getParent().getReservedSlotXY(n, pos)
    }
    this.getRect = function(n, pos) {
        return this.getParent().getRect()
    }
    this.getAttrs = function() {
        return this.getParent().getAttrs()
    }
    this.getAttrPos = function() {
        return this.getParent().getAttrPos()
    }
    this.getPC = function() {
        return this.node.getElementsByTagNameNS(p.ns, "parent-concept")[0]
    }
    this.getCC = function() {
        return this.node.getElementsByTagNameNS(p.ns, "children-concepts")[0]
    }
    this.getParent = function() {
        try {
            var nodes = this.getPC().childNodes
            for (var x = 0; x < nodes.length; x++) {
                if (nodes[x].nodeType == Node.ELEMENT_NODE) {
                    return p.wrap(nodes[x])
                }
            }
        } catch (e) {
            console.log(e)
            return null
        }
    }
    this.getChildren = function() {
        try {
            var nodes = this.getCC().childNodes
            var ret = []
            for (var x = 0; x < nodes.length; x++) {
                if (nodes[x].nodeType == Node.ELEMENT_NODE) {
                    ret.push(p.wrap(nodes[x]))
                }
            }
            return ret
        } catch (e) {
            return []
        }
    }
    this.setParent = function(pnode) {
        var pc = this.getPC()
        clearElement(pc)
        pc.appendChild(pnode)
    }
    this.addChild = function(cnode) {
        var cc = this.getCC()
        cc.appendChild(cnode)
    }
    this.removeChild = function(cnode) {
        var cc = this.getCC()
        cc.removeChild(cnode)
    }
    this.setFree = function(ch) {
        p.schema.insertBefore(ch.node, p.schema.firstChild)
        var cCenter = ch.getCenter()
        ch.setXY(cCenter[0] + p.grid / 2, cCenter[1] + p.grid / 2)
        this.project.refCleanScheduled = true
    }
    this.intoParent = function() {
        this.destroy()
    }
    this.draw = function(parent, reserveSlotsBelow, reserveSlotsAbove) {
        /*check if children exist, else morph into parent */
        var ch = this.getChildren()
        var g = svgEl(parent, "g", {
            id: "svg-" + this.getId(),
            "stroke": p.styles.normalStroke,
            "transform": "translate(0,0)"
        })
        var pEl = this.getParent()
        reserveSlotsAbove = reserveSlotsAbove || 0
        pEl.draw(g, ch.length != 0, reserveSlotsAbove) //we reserve a slot below to connect the arrow

        var pCenter = pEl.getCenter()
        var childrenG = svgEl(g, "g")

        //foreach child, we draw it in place;
        var oldw = 0
        var posx = pCenter[0]
        var posy = pCenter[1] + p.styles.generalization.height
        var doubleHeight = false
        for (var x in ch) {
            ch[x].setXY(posx, posy)
            ch[x].draw(childrenG, 0, 1) //we reserve a slot above to connect to the arrow
            if (ch[x].getAttrPos() == "above" && ch[x].getAttrs().length > 0)
                doubleHeight = true
        }
        if (doubleHeight) {
            posy += p.styles.generalization.belowHorizHeight
        }
        //foreach child, we redraw it translated just enough
        var skip = 1
        for (var x in ch) {
            var bbox = ch[x].getG().getBoundingClientRect()
            var rbbox = ch[x].getRect().getBoundingClientRect()
            var w = rbbox.width / p.zoom
            if (!skip) {
                posx += w / 2
            } else {
                skip -= 1
            }
            var roundx = p.alignToGrid(posx, posy)[0]
            var xy = ch[x].getXY()
            ch[x].setXY(roundx, posy)
            killNode(ch[x].getG())
            ch[x].draw(childrenG, 0, 1)
                /*if (ch[x].type == "Entity") {
                    ch[x].updateTranslate(roundx, posy)
                } else {
                    ch[x].updateTranslate(roundx - xy[0], posy - xy[1])
                }*/
            posx += (bbox.width / p.zoom - (w / 2)) + p.styles.generalization.margin
        }
        //draw lines:
        //draw arrow
        var xy = pEl.getReservedSlotXY(1, "below")
        xy[0] = Math.round(xy[0]) //apply hinting
        var d = "M" + xy[0] + "," + xy[1] + "l-5,8 m 5,-8 l5,8"
            //descend to horizontal line level
        var genNode = [xy[0], pCenter[1] + p.styles.generalization.horizHeight]
        d += "M" + xy[0] + "," + xy[1] + " V" + genNode[1] + " "
        for (var x in ch) {
            var chxy = ch[x].getReservedSlotXY(1, "above")
            d += "M" + genNode[0] + "," + genNode[1]
            d += "H" + Math.round(chxy[0]) + " "
            d += "V" + chxy[1] + " "
        }
        var pathg = svgEl(g, "g")
        svgEl(pathg, "path", { d: d, "stroke-width": p.styles.lines.defaultStrokeWidth, "id": "svg-" + this.getId() + "genpath", "fill": "none" })
        svgEl(pathg, "path", { d: d, "stroke-width": 16, "stroke-opacity": 0, "fill": "none" })
        var that = this
        pathg.addEventListener("click", function(ev) {
            p.selection.clicked(that, ev)
        })
    }
    this.selectOn = function() {
        var path = p.svg.getElementById("svg-" + this.getId() + "genpath")
        path.style.stroke = p.styles.selectedStroke
        path.style.strokeWidth = p.styles.lines.selectedStrokeWidth
    }
    this.selectOff = function() {
        var path = p.svg.getElementById("svg-" + this.getId() + "genpath")
        path.style.stroke = p.styles.normalStroke
        path.style.strokeWidth = p.styles.lines.defaultStrokeWidth
    }
    this.checkConsistency = function() {
        var ch = this.getChildren()
        if (ch.length == 0) {
            this.intoParent()
            return
        }
        var pa = this.getParent()
        pa.checkConsistency()
        for (var x in ch) {
            ch[x].checkConsistency()
        }
    }
}

function genTravelUp(node) {
    while (node != erp.schema && node.localName != "generalization") {
        node = node.parentNode
    }
    return node
}

function newGeneralization(objs) {
    //add the first selected object as parent and subsequent ones as children
    var up = genTravelUp(objs[0].node)
    var el = null
    if (up.localName == "generalization" && objs[0].node.parentNode.localName == "parent-concept") {
        //this is already a generalization;
        el = up
    } else {
        var before = erp.schema.lastChild
        if (up != erp.schema) {
            up = objs[0].node.parentNode
            before = objs[0].node
        }
        el = erp.mkErElement("generalization", up, {}, true)
        var pc = erp.mkErElement("parent-concept", el)
        var cc = erp.mkErElement("children-concepts", el)
        up.insertBefore(el, before)
    }
    var g = new Generalization(el, erp)

    g.setParent(objs[0].node)
    for (var x = 1; x < objs.length; x++) {
        //travel upward to know if we are in a generalization
        var up = genTravelUp(objs[x].node)
        if (up.localName == "generalization") {
            g.addChild(up)
        } else {
            g.addChild(objs[x].node)
        }
    }
    erp.addState()
    erp.selection.set([el.getAttribute("id")])
}

var gct = document.getElementById("generalizationChildrenTable")

function updateGeneralizationPanel() {
    clearElement(gct)
    var gen = erp.get(erp.selection.s[0])
    if (!gen) return
    var ch = gen.getChildren()
    for (var x in ch) {
        var tr = mkEl(gct, "tr")
        var td1 = mkEl(tr, "td", { "font-size": 0 })
        var td2 = mkEl(tr, "td")
        mkButtons(gen, ch[x], td1, td2)
    }
}

function mkButtons(gen, ch, td1, td2) {

    var up = mkEl(td1, "div", { "class": "upAttr" })
    up.addEventListener("click", function() {
        ch.moveUp()
        erp.addState()
        updateGeneralizationPanel()
    })
    var del = mkEl(td1, "div", { "class": "deleteAttr" })
    del.addEventListener("click", function() {
        gen.setFree(ch)
        erp.addState()
        updateGeneralizationPanel()
    })
    var down = mkEl(td1, "div", { "class": "downAttr" })
    down.addEventListener("click", function() {
        console.log("down")
        ch.moveDown()
        erp.addState()
        updateGeneralizationPanel()
    })
    td2.innerHTML = "Entity: "
    var link = mkEl(td2, "a", { href: "#", onclick: "return false" })
    link.addEventListener("click", function() {
        erp.selection.set([ch.getId()])
    })
    link.innerHTML = ch.getName()
}