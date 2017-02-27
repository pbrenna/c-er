"use strict";
/*
 * Relationship.js
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


function Relationship(node, project) {
    ERObject.apply(this, [node, project])
    Concept.apply(this)
    Selectable.apply(this)
    Draggable.apply(this)
    Movable.apply(this)
    this.type = "Relationship"
    var p = this.project
    var node = this.node
    this.addParticipation = function(entity, mult_min, mult_max) {
        var part = new Participation(
            this.project.mkErElement("participation", this.node),
            this.project)
        part.setEntity(entity)
        part.setMultMin(mult_min)
        part.setMultMax(mult_max)
        return part
    }
    this.getParticipations = function() {
        var ret = []
        var parts = this.node.getElementsByTagNameNS(p.ns, "participation")
        for (var x = 0; x < parts.length; x++) {
            ret.push(p.wrap(parts[x]))
        }
        return ret
    }
    this.draw = function(parent) {
        var xy = this.getXY()
        var x = xy[0],
            y = xy[1]
        var w = p.styles.relationship.defaultW
        var h = p.styles.relationship.defaultH
        if (x === null || y === null || !h || !w)
            throw new DOMException("missing x,y coordinates of relationship " + this.getId())
        var g = svgEl(parent, "g", {
            id: 'svg-' + this.getId(),
            transform: "translate(" + x + "," + y + ")",
            stroke: p.styles.normalStroke,
            'stroke-width': p.styles.relationship.defaultStrokeWidth
        })
        var attrs = drawAttrs(g, this.getAttrs(), p.styles.relationship, 10, true, this.getAttrPos())
        var reqw = attrs.reqWidth + p.styles.relationship.corners * 2
        w = max(w, reqw)
        var attrX = (-reqw / 2) + p.styles.relationship.corners - p.styles.relationship.attrSpacing * 0
        var text = svgEl(g, "text", {
            'text-anchor': 'middle',
            x: 0,
            y: 5,
            'stroke-width': 0,
            'font-family': p.styles.defaultFont,
            'font-size': p.styles.defaultFontSize,
        })
        text.textContent = p.getErAttr(node, "name")
        var textW = text.getBoundingClientRect().width / p.zoom
        var availableW = w - (p.styles.relationship.padding * 2)
        var textScale = availableW / textW
        if (textScale < 1) {
            text.setAttribute("font-size", p.styles.defaultFontSize * textScale)
            text.setAttribute("y", 5 * textScale)
        }

        var polygon = svgEl(g, "path", {
            d: "M" + (-w / 2) + ",0" +
                " l" + (w / 2) + "," + (h / 2) +
                " l" + (w / 2) + "," + (-h / 2) +
                " l" + (-w / 2) + "," + (-h / 2) + " Z",
            fill: "#ffffff",
        })
        attrs.g.transform.baseVal.getItem(0).setTranslate(attrX, 0)
        mkFirstChild(polygon)
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


        //recursively draw inner participations
        var parts = this.getParticipations()
        for (var i in parts) {
            parts[i].draw(parent)
        }
    }
}

var relationshipNameInput = document.getElementById("relationshipNameInput")
relationshipNameInput.addEventListener("change", function(ev) {
    var e = erp.selection.getFirst()
    e.setName(this.value)
    erp.addState()
})
var relationshipAttrTable = document.getElementById("relationshipAttrTable")
var relationshipAddAttr = document.getElementById("relationshipAddAttr")
var relationshipAttrPos = document.getElementById("relationshipAttrPos")
relationshipAttrPos.addEventListener("change", function(ev) {
    var val = this.value
    var e = erp.selection.getFirst()
    e.setAttrPos(val)
    erp.addState()
    updateRelationshipPanel()
})

function updateRelationshipPanel() {
    var e = erp.selection.getFirst()
    relationshipNameInput.value = e.getName()
    relationshipAttrPos.value = e.getAttrPos()
    clearElement(relationshipAttrTable)
    var attrs = e.getAttrs()
    for (var x in attrs) {
        var attr = attrs[x]
        mkAttrRow(attr, relationshipAttrTable, updateRelationshipPanel)
            //using function call to capture "attr" in closures
    }
}

function newRelationship(ev) {
    var name = "Relationship"
    var el = erp.mkErElement("relationship", erp.schema)
    var pos = erp.getMouseInDocument(ev)
    var rounded = erp.alignToGrid(pos.x, pos.y)
    erp.setViewAttr(el, "x", rounded[0])
    erp.setViewAttr(el, "y", rounded[1])
    var c = new Concept(el, erp)
    c.setName(name)
    erp.addState()
    erp.selection.set([el.getAttribute("id")])
}

function relationshipAddAttribute() {
    var e = erp.selection.getFirst()
    e.addAttribute("attribute", false)
    erp.addState()
    updateRelationshipPanel()
}