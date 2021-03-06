"use strict";
/*
 * Generalization.js
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


function Generalization(node, project) {
    ERObject.apply(this, [node, project])
    Concept.apply(this)
    Draggable.apply(this) //will only use "updateTranslate"
    Movable.apply(this)
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
        p.schema.appendChild(ch.node)
        var cCenter = ch.getCenter()
        ch.setXY(cCenter[0] + p.grid / 2, cCenter[1] + p.grid / 2)
        this.project.refCleanScheduled = true
            //select the freed node
        p.selection.set([ch.getId()])
    }
    this.intoParent = function() {
        this.destroy()
    }
    this.transRight = function(dx) {
        if (dx != 0) {
            var pa = this.getParent()
            var pxy = pa.getXY()
            pa.setXY(pxy[0] + dx, pxy[1])
            var ch = this.getChildren()
            for (var x in ch) {
                if (ch[x].type == "Entity") {
                    var cxy = ch[x].getXY()
                    ch[x].setXY(cxy[0] + dx, cxy[1])
                } else {
                    ch[x].transRight(dx)
                        //console.log("nope", pxy[0], x, old[0])
                }
            }
        }
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
        var belowHorizHeight = 0
        for (var x in ch) {
            ch[x].setXY(posx, posy)
            ch[x].draw(childrenG, 0, 1) //we reserve a slot above to connect to the arrow
            if (ch[x].getAttrPos() == "above" && ch[x].getAttrs().length > 0) {
                var zs = p.zoomedScroll()
                var bbox = ch[x].getG().getBoundingClientRect()
                var rbbox = ch[x].getRect().getBoundingClientRect()
                var curx = bbox.top / p.zoom + zs[0]
                var currx = rbbox.top / p.zoom + zs[0]
                belowHorizHeight = max(belowHorizHeight, currx - curx - 10)
            }
        }
        posy += belowHorizHeight
            //foreach child, we redraw it translated just enough
        var skip = 1
        var initialPosx = posx
        for (var x in ch) {
            var bbox = ch[x].getG().getBoundingClientRect()
            var rbbox = ch[x].getRect().getBoundingClientRect()
            var w = rbbox.width / p.zoom
            if (!skip) {
                posx += w / 2
            } else {
                skip -= 1
            }
            var rounded = p.alignToGrid(posx, posy)
            var roundx = rounded[0]
            var roundy = rounded[1]
            var xy = ch[x].getXY()
                /*code for redraw*/
                /*killNode(ch[x].getG())
                ch[x].draw(childrenG, 0, 1)*/

            /*code for incremental translation: faster but buggier*/

            if (ch[x].type == "Entity") {
                ch[x].updateTranslate(roundx, roundy)
                    //ch[x].setXY(roundx + xy[0], roundy)
                ch[x].setXY(roundx, roundy)
            } else {
                ch[x].updateTranslate(roundx - xy[0], roundy - xy[1])
                ch[x].setXY(xy[0], roundy)
                ch[x].transRight(roundx - xy[0])
            }
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
            d += "H" + (Math.round(chxy[0])) + " "
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
        this.getParent().selectOn()
        var ch = this.getChildren()
        for (var x in ch) {
            ch[x].selectOn()
        }
    }
    this.selectOff = function() {
        var path = p.svg.getElementById("svg-" + this.getId() + "genpath")
        path.style.stroke = p.styles.normalStroke
        path.style.strokeWidth = p.styles.lines.defaultStrokeWidth
        this.getParent().selectOff()
        var ch = this.getChildren()
        for (var x in ch) {
            ch[x].selectOff()
        }
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
    var gen = erp.selection.getFirst()
    if (gen.type != "Generalization") return
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
        ch.moveDown()
        erp.addState()
        updateGeneralizationPanel()
    })
    td2.innerHTML = ch.type + ": "
    var link = mkEl(td2, "a", { href: "#", onclick: "return false" })
    link.addEventListener("click", function() {
        erp.selection.set([ch.getId()])
    })
    link.innerHTML = ch.getName()
}