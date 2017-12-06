"use strict";
/*
 * Entity.js
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


function Entity(node, project) {
    ERObject.apply(this, [node, project])
    Concept.apply(this)
    Selectable.apply(this)
    Draggable.apply(this)
    Movable.apply(this)
    this.type = "Entity"
    var p = this.project
    var node = this.node
    this.getRect = function() {
        return p.svg.getElementById("svg-" + this.getId() + "-rect")
    }

    //drawing things
    this.draw = function(parent, reserveSlotsBelow, reserveSlotsAbove) {
        console.log("draw entity")
        var xy = this.getXY()
        var x = xy[0],
            y = xy[1]
        var w = p.styles.entity.defaultW
        var h = p.styles.entity.defaultH
        reserveSlotsBelow = reserveSlotsBelow || 0
        reserveSlotsAbove = reserveSlotsAbove || 0
        if (x === null || y === null || !h || !w)
            throw new DOMException("missing x,y coordinates of entity" + this.getId())
        var g = svgEl(parent, "g", {
            id: 'svg-' + this.getId(),
            transform: "translate(" + x + "," + y + ")",
            stroke: p.styles.normalStroke,
            'stroke-width': p.styles.entity.defaultStrokeWidth
        })
        var reserveSlotsLeft = this.getAttrPos() == "above" ? reserveSlotsAbove : 0
        var reserveSlotsRight = this.getAttrPos() == "below" ? reserveSlotsBelow : 0
        var attrs = drawAttrs(g, this.getAttrs(), p.styles.entity, h / 2, false, this.getAttrPos(), reserveSlotsLeft, reserveSlotsRight)

        var reqw = attrs.reqWidth + p.styles.entity.corners * 2
        w = max(reqw, w)
        var attrX = -(reqw / 2) + p.styles.entity.corners
        attrs.g.transform.baseVal.getItem(0).setTranslate(Math.round(attrX) - 0.5, 0)
        var text = svgEl(g, "text", {
            'text-anchor': 'middle',
            x: 0,
            y: 5,
            'stroke-width': 0,
            'font-family': p.styles.defaultFont,
            'font-size': p.styles.defaultFontSize
        })
        text.textContent = p.getErAttr(node, "name")
        var textW = text.getBoundingClientRect().width / p.zoom
        w = max(w, textW + p.styles.entity.padding * 2)
        var rect = svgEl(g, "rect", {
            height: h,
            id: "svg-" + this.getId() + "-rect",
            width: w,
            fill: "#ffffff",
            x: -w / 2,
            y: -h / 2
        })
        mkFirstChild(rect)
        mkFirstChild(attrs.g)
        preventBrowserDrag(g)

        var that = this
        var startFunc = function(ev) {
            mkLastChild(this)
            that.bringUp()
            p.dragStart(that, ev)
        }
        g.addEventListener('mousedown', startFunc)
        g.addEventListener('touchstart', startFunc)
    }
    this.getReservedSlotXY = function(n, pos) {
        var c = this.getCenter()
        var nAttr = this.getAttrPos() == pos ? this.getAttrs().length : 0
        if (pos == "above") {
            var y = -p.styles.entity.defaultH / 2
            var reqw = p.styles.entity.attrSpacing * (nAttr - 1 + n)
            var attrX = -(reqw / 2) + p.styles.entity.corners - p.styles.entity.attrSpacing
            return [attrX + c[0], y + c[1]]
        } else {
            var y = p.styles.entity.defaultH / 2
            var reqw = p.styles.entity.attrSpacing * (nAttr - 1 + n)
            var attrX = -(reqw / 2) + p.styles.entity.corners
            return [attrX + p.styles.entity.attrSpacing * (nAttr - 1) + c[0], y + c[1]]
        }
    }
    this.lineIntersect = function(line) {
        var r = this.getRect()
        var bbox = r.getBoundingClientRect()
        var s = p.zoomedScroll()
        var topLeft = [
            bbox.left / p.zoom + s[0],
            bbox.top / p.zoom + s[1]
        ]
        var topRight = [
            topLeft[0] + bbox.width / p.zoom,
            topLeft[1]
        ]
        var bottomLeft = [
            topLeft[0],
            topLeft[1] + bbox.height / p.zoom
        ]
        var bottomRight = [
            topRight[0],
            bottomLeft[1]
        ]
        var res = intersectCalc(line, [
            //lines
            [topLeft, topRight],
            [topLeft, bottomLeft],
            [topRight, bottomRight],
            [bottomLeft, bottomRight]
        ])
        if (res.length < 1)
            console.log("no inters :(")
        return res
    }
    this.isFree = function() {
        var ancCount = this.countAncestors()
        return ancCount == 0 || (ancCount == 1 && this.node.parentNode.localName == "parent-concept")
    }
    this.countAncestors = function() {
        var n = this.node
        var count = 0
        while (n != p.schema) {
            n = n.parentNode
            if (p.wrap(n))
                count += 1
        }
        return count
    }

}

//New entity
function newEntity(ev) {
    var name = "Entity"
    var el = erp.mkErElement("entity", erp.schema)
    var pos = erp.getMouseInDocument(ev)
    var rounded = erp.alignToGrid(pos.x, pos.y)
    erp.setViewAttr(el, "x", rounded[0])
    erp.setViewAttr(el, "y", rounded[1])
    var c = new Entity(el, erp)
    c.setName(name)
    erp.addState()
    erp.selection.set([el.getAttribute("id")])
}

var entityNameInput = document.getElementById("entityNameInput")
entityNameInput.addEventListener("change", function(ev) {
    var e = erp.selection.getFirst()
    e.setName(this.value)
    erp.addState()
})

var entityAttrTable = document.getElementById("entityAttrTable")
var entityAddAttr = document.getElementById("entityAddAttr")
var entityAttrPos = document.getElementById("entityAttrPos")
entityAttrPos.addEventListener("change", function(ev) {
    var val = this.value
    var e = erp.selection.getFirst()
    e.setAttrPos(val)
    erp.addState()
    updateEntityPanel()
})

function updateEntityPanel() {
    var e = erp.selection.getFirst()
    entityNameInput.value = e.getName()
    entityAttrPos.value = e.getAttrPos()
    clearElement(entityAttrTable)
    var attrs = e.getAttrs()
    for (var x in attrs) {
        var attr = attrs[x]
        mkAttrRow(attr, entityAttrTable, updateEntityPanel)
            //using function call to capture "attr" in closures
    }
}


function entityAddAttribute() {
    var e = erp.selection.getFirst()
    e.addAttribute("attribute", false)
    erp.addState()
    updateEntityPanel()
}