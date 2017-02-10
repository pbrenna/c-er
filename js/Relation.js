function Relation(concept) {
    this.concept = concept
    this.type = "Relation"
    this.addParticipation = function(entity, mult_min, mult_max) {
        var part = new Participation(
            this.concept.project.mkErElement("participation", this.concept.node),
            this.concept.project)
        part.setEntity(entity)
        part.setMultMin(mult_min)
        part.setMultMax(mult_max)
        return part
    }
    this.getId = function() {
        return this.concept.getId()
    }
    this.destroy = function() {
        this.concept.destroy()
        this.concept = null
    }
    var p = this.concept.project
    var node = this.concept.node
    this.getG = function() {
        return p.svg.getElementById('svg-' + this.getId())
    }
    this.draw = function(parent) {
        var x = parseInt(p.getViewAttr(node, "x"))
        var y = parseInt(p.getViewAttr(node, "y"))
        var w = parseInt(p.getViewAttr(node, "w"))
        var h = parseInt(p.getViewAttr(node, "h"))
        if (x === null || y === null || !h || !w)
            throw new DOMException("missing x,y coordinates of relation " + this.getId())
        var g = svgEl(parent, "g", {
            id: 'svg-' + this.getId(),
            transform: "translate(" + x + "," + y + ")",
            stroke: p.styles.normalStroke
        })
        var attrs = drawAttrs(g, this.concept.getAttrs(), p.styles.relation)
        var oldw = w;
        var rectx = 0
        var reqw = attrs.reqWidth + p.styles.relation.corners * 2
        if (oldw < reqw) {
            w = reqw
            rectx -= (w - oldw) / 2
        }
        var attrX = rectx + w / 2 - (reqw / 2) + p.styles.relation.corners
        var text = svgEl(g, "text", {
            'text-anchor': 'middle',
            x: oldw / 2,
            y: h / 2 + 5,
            'stroke-width': 0,
            'font-family': p.styles.defaultFont
        })
        text.textContent = p.getErAttr(node, "name")
        var textW = text.getBoundingClientRect().width
        var oldw = w
        if (w < (textW + p.styles.relation.padding * 2)) {
            w = (textW + p.styles.relation.padding * 2)
            rectx -= (w - oldw) / 2
        }
        var newh = w / ((1 + Math.sqrt(5)) / 2)
        var recty = (h - newh) / 2
        var oldh = h
        h = newh
        var polygon = svgEl(g, "path", {
            d: "M" + rectx + "," + (h / 2 + recty) +
                " l" + (w / 2) + "," + (h / 2) +
                " l" + (w / 2) + "," + (-h / 2) +
                " l" + (-w / 2) + "," + (-h / 2) + " Z",
            fill: "#ffffff",
            'stroke-width': 1,
            x: rectx,
            y: 0
        })
        attrs.g.parentNode.removeChild(attrs.g)
        attrs = drawAttrs(g, this.concept.getAttrs(), p.styles.relation, -recty)
            //redraw attrs due to changed line height
        attrs.g.transform.baseVal.getItem(0).setTranslate(attrX, oldh / 2)
        mkFirstChild(polygon)
        mkFirstChild(attrs.g)
        preventBrowserDrag(g)

        var that = this
        g.addEventListener('mousedown', function(ev) {
            mkLastChild(this)
            that.concept.moveUp()
            erp.dragStart(that, ev)
        })

        g.addEventListener("click", function(ev) {
            p.selection.clicked(that, ev)
        })
    }
    this.selectOn = function() {
        var g = this.getG()
        g.style.stroke = p.styles.selectedStroke
    }
    this.selectOff = function() {
        var g = this.getG()
        g.style.stroke = p.styles.normalStroke
    }
    this.moveRelXY = function(x, y) {
        var curx = parseInt(p.getViewAttr(node, "x")) + x / p.zoom
        var cury = parseInt(p.getViewAttr(node, "y")) + y / p.zoom
        var g = this.getG()
        g.transform.baseVal.getItem(0).setTranslate(max(curx, 0), max(cury, 0))
    }
    this.endDragXY = function(x, y) {
        var curx = parseInt(p.getViewAttr(node, "x")) + x / p.zoom
        var cury = parseInt(p.getViewAttr(node, "y")) + y / p.zoom
        if (x != 0 || y != 0) {
            p.setViewAttr(node, "x", max(curx, 0))
            p.setViewAttr(node, "y", max(cury, 0))
            p.patchState(this.addStateNumber)
        }
    }
    this.getCenter = function() {
        var x = parseInt(p.getViewAttr(node, "x"))
        var y = parseInt(p.getViewAttr(node, "y"))
        var w = parseInt(p.getViewAttr(node, "w"))
        var h = parseInt(p.getViewAttr(node, "h"))
        return [x + w / 2, y + h / 2]
    }
}

var relationNameInput = document.getElementById("relationNameInput")
relationNameInput.addEventListener("change", function(ev) {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.concept.setName(this.value)
    erp.addState()
})
var relationAttrTable = document.getElementById("relationAttrTable")
var relationAddAttr = document.getElementById("relationAddAttr")

function updateRelationPanel() {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    relationNameInput.value = e.concept.getName()
    clearElement(relationAttrTable)
    var attrs = e.concept.getAttrs()
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
    erp.setViewAttr(el, "h", h)
    erp.setViewAttr(el, "w", w)
    var c = new Concept(el, erp)
    c.setName(name)
    erp.addState()
    erp.selection.set([el.getAttribute("id")])
}

function relationAddAttribute() {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.concept.addAttribute("attribute", false)
    erp.addState()
    updateRelationPanel()
}