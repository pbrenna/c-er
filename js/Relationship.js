"use strict";

function Relationship(node, project) {
    Concept.apply(this, [node, project])
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
            stroke: p.styles.normalStroke
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
            'font-size': p.styles.defaultFontSize
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
            'stroke-width': 1,
        })
        attrs.g.transform.baseVal.getItem(0).setTranslate(attrX, 0)
        mkFirstChild(polygon)
        mkFirstChild(attrs.g)
        preventBrowserDrag(g)

        var that = this
        g.addEventListener('mousedown', function(ev) {
            mkLastChild(this)
            that.bringUp()
            erp.dragStart(that, ev)
        })

        g.addEventListener("click", function(ev) {
            p.selection.clicked(that, ev)
        })

        //recursively draw inner participations
        var parts = this.getParticipations()
        for (var i in parts) {
            parts[i].draw(parent)
        }
    }
    this.calculateWidth = function(text, attrReqW) {

    }
    this.isFree = function() {
        return true
    }
}

var relationshipNameInput = document.getElementById("relationshipNameInput")
relationshipNameInput.addEventListener("change", function(ev) {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.setName(this.value)
    erp.addState()
})
var relationshipAttrTable = document.getElementById("relationshipAttrTable")
var relationshipAddAttr = document.getElementById("relationshipAddAttr")
var relationshipAttrPos = document.getElementById("relationshipAttrPos")
relationshipAttrPos.addEventListener("change", function(ev) {
    var val = this.value
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.setAttrPos(val)
    erp.addState()
    updateRelationPanel()
})

function updateRelationshipPanel() {
    var id = erp.selection.s[0]
    var e = erp.get(id)
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
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.addAttribute("attribute", false)
    erp.addState()
    updateRelationshipPanel()
}