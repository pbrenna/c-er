"use strict";

function Entity(node, project) {
    Concept.apply(this, [node, project])
    this.type = "Entity"
    var p = this.project
    var node = this.node
    this.getRect = function() {
        return p.svg.getElementById("svg-" + this.getId() + "-rect")
    }

    //drawing things
    this.draw = function(parent, reserveSlotsBelow, reserveSlotsAbove) {
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
            stroke: p.styles.normalStroke
        })
        var reserveSlotsLeft = this.getAttrPos() == "above" ? reserveSlotsAbove : 0
        var reserveSlotsRight = this.getAttrPos() == "below" ? reserveSlotsBelow : 0
        var attrs = drawAttrs(g, this.getAttrs(), p.styles.entity, h / 2, false, this.getAttrPos(), reserveSlotsLeft, reserveSlotsRight)

        var reqw = attrs.reqWidth + p.styles.entity.corners * 2
        w = max(reqw, w)
        var attrX = -(reqw / 2) + p.styles.entity.corners
        attrs.g.transform.baseVal.getItem(0).setTranslate(attrX, 0)
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
            'stroke-width': 1,
            x: -w / 2,
            y: -h / 2
        })
        mkFirstChild(rect)
        mkFirstChild(attrs.g)
        preventBrowserDrag(g)

        var that = this
        g.addEventListener('mousedown', function(ev) {
            mkLastChild(this)
                //that.moveUp()
            erp.dragStart(that, ev)
        })

        g.addEventListener("click", function(ev) {
            p.selection.clicked(that, ev)
        })
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
            bbox.left + s[0],
            bbox.top + s[1]
        ]
        var topRight = [
            topLeft[0] + bbox.width,
            topLeft[1]
        ]
        var bottomLeft = [
            topLeft[0],
            topLeft[1] + bbox.height
        ]
        var bottomRight = [
            topRight[0],
            bottomLeft[1]
        ]
        return intersectCalc(line, [
            //lines
            [topLeft, topRight],
            [topLeft, bottomLeft],
            [topRight, bottomRight],
            [bottomLeft, bottomRight]
        ])
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
    erp.setViewAttr(el, "x", pos.x)
    erp.setViewAttr(el, "y", pos.y)
    var c = new Concept(el, erp)
    c.setName(name)
    erp.addState()
    erp.selection.set([el.getAttribute("id")])
}

var entityNameInput = document.getElementById("entityNameInput")
entityNameInput.addEventListener("change", function(ev) {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.setName(this.value)
    erp.addState()
})

var entityAttrTable = document.getElementById("entityAttrTable")
var entityAddAttr = document.getElementById("entityAddAttr")
var entityAttrPos = document.getElementById("entityAttrPos")
entityAttrPos.addEventListener("change", function(ev) {
    var val = this.value
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.setAttrPos(val)
    erp.addState()
    updateEntityPanel()
})

function updateEntityPanel() {
    var id = erp.selection.s[0]
    var e = erp.get(id)
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
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.addAttribute("attribute", false)
    erp.addState()
    updateEntityPanel()
}