"use strict";

function Relation(node, project) {
    Concept.apply(this, [node, project])
    this.type = "Relation"
    this.addParticipation = function(entity, mult_min, mult_max) {
        var part = new Participation(
            this.project.mkErElement("participation", this.node),
            this.project)
        part.setEntity(entity)
        part.setMultMin(mult_min)
        part.setMultMax(mult_max)
        return part
    }
    var p = this.project
    var node = this.node
    this.draw = function(parent) {
        var xy = this.getXY()
        var x = xy[0],
            y = xy[1]
        var w = p.styles.relation.defaultW
        var h = p.styles.relation.defaultH
        if (x === null || y === null || !h || !w)
            throw new DOMException("missing x,y coordinates of relation " + this.getId())
        var g = svgEl(parent, "g", {
            id: 'svg-' + this.getId(),
            transform: "translate(" + x + "," + y + ")",
            stroke: p.styles.normalStroke
        })
        var attrs = drawAttrs(g, this.getAttrs(), p.styles.relation, 10, true, this.getAttrPos())
        var reqw = attrs.reqWidth + p.styles.relation.corners * 2
        w = max(w, reqw)
        var attrX = (-reqw / 2) + p.styles.relation.corners - p.styles.relation.attrSpacing * 0
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
        var availableW = w - (p.styles.relation.padding * 2)
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
            that.moveUp()
            erp.dragStart(that, ev)
        })

        g.addEventListener("click", function(ev) {
            p.selection.clicked(that, ev)
        })
    }
    this.calculateWidth = function(text, attrReqW) {

    }
}

var relationNameInput = document.getElementById("relationNameInput")
relationNameInput.addEventListener("change", function(ev) {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.setName(this.value)
    erp.addState()
})
var relationAttrTable = document.getElementById("relationAttrTable")
var relationAddAttr = document.getElementById("relationAddAttr")
var relationAttrPos = document.getElementById("relationAttrPos")
relationAttrPos.addEventListener("change", function(ev) {
    var val = this.value
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.setAttrPos(val)
    erp.addState()
    updateRelationPanel()
})

function updateRelationPanel() {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    relationNameInput.value = e.getName()
    relationAttrPos.value = e.getAttrPos()
    clearElement(relationAttrTable)
    var attrs = e.getAttrs()
    for (var x in attrs) {
        var attr = attrs[x]
        mkAttrRow(attr, relationAttrTable, updateRelationPanel)
            //using function call to capture "attr" in closures
    }
}

function newRelation(ev) {
    var name = "Relation"
    var el = erp.mkErElement("relation", erp.schema)
    var pos = erp.getMouseInDocument(ev)
    var h = erp.styles.relation.defaultH
    var w = erp.styles.relation.defaultW
    erp.setViewAttr(el, "x", pos.x - w / 2)
    erp.setViewAttr(el, "y", pos.y - h / 2)
    var c = new Concept(el, erp)
    c.setName(name)
    erp.addState()
    erp.selection.set([el.getAttribute("id")])
}

function relationAddAttribute() {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.addAttribute("attribute", false)
    erp.addState()
    updateRelationPanel()
}