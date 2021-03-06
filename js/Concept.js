"use strict";
/*
 * Concept.js
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


function Concept() {
    this.setName = function(name) {
        this.node.setAttributeNS(this.project.ns, "name", name)
    }
    this.setXY = function(x, y) {
        this.project.setViewAttr(this.node, "x", x)
        this.project.setViewAttr(this.node, "y", y)
    }
    this.getName = function() {
        return this.node.getAttributeNS(this.project.ns, "name")
    }
    this.getAttrs = function() {
        var l = []
        var attrs = this.node.getElementsByTagNameNS(this.project.ns, "attr")
        for (var i = 0; i < attrs.length; i++) {
            var el = attrs[i]
            var wrapper = new Attr(el, this.project)
            l.push(wrapper)
        }
        return l
    }
    this.addAttribute = function(name, isPrimary) {
        var p = this.project
        var attr = new Attr(p.mkErElement("attr", this.node), p)
        attr.setName(name)
        attr.setIsPrimary(isPrimary)
    }
    this.destroy = function() {
        if (this.node.parentNode != this.project.schema) {
            var g = genTravelUp(this.node)
            if (this.node.parentNode.localName == "parent-concept") {
                //get outer Generalization
                this.project.wrap(g).destroy()
            } else if (this.node.parentNode.localName == "children-concepts") {
                if (this.node.parentNode.childNodes.length == 1) {
                    this.project.wrap(g).destroy()
                }
            }
        }
        killNode(this.node)
        this.project.refCleanScheduled = true
        this.node = null
    }
    this.bringUp = function() {
        var el = genTravelUp(this.node.parentNode)
        if (el == this.project.schema) {
            mkLastChild(this.getG())
            mkLastChild(this.node)
        } else {
            //console.log(this.project.wrap(el))
            this.project.wrap(el).bringUp()
        }
    }
    this.getXY = function() {
        var x = parseFloat(this.project.getViewAttr(this.node, "x"))
        var y = parseFloat(this.project.getViewAttr(this.node, "y"))
        return [x, y]
    }
    this.getCenter = function() {
        return this.getXY()
    }
    this.setAttrPos = function(pos) {
        var allowed = ["above", "below"]
        if (allowed.indexOf(pos) >= 0) {
            this.project.setViewAttr(this.node, "attr-pos", pos)
        }
    }
    this.getAttrPos = function() {
        return this.project.getViewAttr(this.node, "attr-pos") || "below"
    }
    this.checkConsistency = function() {
        //normally empty, specialize if needed
    }
}



//Common between Entity and Relationship
function mkAttrRow(attr, tbody, fnRefresh) {
    var name = attr.getName()
    var primary = attr.getIsPrimary()
    var tr = mkEl(tbody, "tr")
    var td = mkEl(tr, "td")
    var checkbox = mkEl(td, "input", {
        type: "checkbox",
        autocomplete: "off",
        title: "Primary"
    })
    if (primary) {
        checkbox.setAttribute("checked", "true")
    }
    checkbox.addEventListener("change", function(ev) {
        attr.setIsPrimary(this.checked)
        erp.addState()
    })
    var td2 = mkEl(tr, "td")
    var attrNameInput = mkEl(td2, "input", {
        type: "text",
        value: name,
        "style": "width: 150px; float:right"
    })
    attrNameInput.addEventListener("change", function() {
        attr.setName(this.value)
        erp.addState()
    })

    var up = mkEl(td, "div", { "class": "upAttr" })
    up.addEventListener("click", function() {
        attr.moveUp()
        erp.addState()
        fnRefresh()
    })
    var del = mkEl(td, "div", { "class": "deleteAttr" })
    del.addEventListener("click", function() {
        attr.destroy()
        erp.addState()
        fnRefresh()
    })
    var down = mkEl(td, "div", { "class": "downAttr" })
    down.addEventListener("click", function() {
        attr.moveDown()
        erp.addState()
        fnRefresh()
    })
}


function drawAttrs(parent, attrs, style, additionalSpace, mustBeEven, position, reserveSlotsLeft, reserveSlotsRight) {
    additionalSpace = additionalSpace || 0
    var ret = {}
    var g = ret.g = svgEl(parent, "g", {
        "transform": "translate(0,0)"
    })
    var n = attrs.length
    var spacing = style.attrSpacing
    var lineh = style.attrLineH + additionalSpace
    var rad = style.attrCircRad
    var texty = lineh + style.attrOffset
    var circley = lineh + 2 + rad / 2
    var textAnchor = "end"
    var attrDist = style.attrDist
    if (position == "above") {
        lineh = -lineh
        circley = -circley
        texty = -texty
        textAnchor = "start"
        attrDist = -attrDist
    }
    mustBeEven = mustBeEven || 0
    reserveSlotsLeft = reserveSlotsLeft || 0
    reserveSlotsRight = reserveSlotsRight || 0
    var posx = spacing * reserveSlotsLeft
    for (var i = 0; i < n; i++) {
        var rposx = Math.round(posx)
        var att = attrs[i]
        var path = svgEl(g, "path", {
            "d": "M" + rposx + ",0 l0," + lineh
        })
        var circle = svgEl(g, "circle", {
            cy: circley,
            cx: Math.round(rposx),
            r: rad,
            fill: att.getIsPrimary() ? style.primaryFill : 'none'
        })
        var textx = rposx - attrDist
        var text = svgEl(g, "text", {
            x: textx,
            y: texty,
            'font-family': erp.styles.defaultFont,
            "font-size": style.attrFontSize,
            "stroke": 'none',
            "dominant-baseline": "middle",
            "stroke-width": "0",
            'text-anchor': textAnchor,
            'text-rendering': 'geometricPrecision',
            'transform': "rotate(" + style.attrRotationDeg + "," + rposx + "," + texty + ")"
        })
        text.textContent = att.getName()
        posx += spacing
    }
    posx += reserveSlotsRight * spacing
    if (mustBeEven && (n + reserveSlotsLeft + reserveSlotsRight) % 2 != 0) {
        posx += spacing
    }
    ret.reqWidth = posx - spacing
    return ret
}