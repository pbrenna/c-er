function Entity(concept) {
    this.concept = concept
    this.destroy = function() {
        this.concept.destroy()
        this.concept = null
    }
    this.type = "Entity"
    this.getId = function() {
        return this.concept.getId()
    }
    var p = this.concept.project

    var node = this.concept.node
    this.getG = function() {
        return p.svg.getElementById('svg-' + this.getId())
    }

    //drawing things
    this.draw = function(parent) {
        var x = parseInt(p.getViewAttr(node, "x"))
        var y = parseInt(p.getViewAttr(node, "y"))
        var w = parseInt(p.getViewAttr(node, "w"))
        var h = parseInt(p.getViewAttr(node, "h"))
        if (x === null || y === null || !h || !w)
            throw new DOMException("missing x,y coordinates of entity" + this.getId())
        var g = svgEl(parent, "g", {
            id: 'svg-' + this.getId(),
            transform: "translate(" + x + "," + y + ")",
            stroke: p.styles.normalStroke
        })
        var attrs = drawAttrs(g, this.concept.getAttrs(), p.styles.entity)
            //attrs.g width is needed to compute final rectangle width
        var oldw = w;
        var rectx = 0
        var reqw = attrs.reqWidth + p.styles.entity.corners * 2
        if (oldw < reqw) {
            w = reqw
            rectx -= (w - oldw) / 2
        }
        var attrX = rectx + w / 2 - (reqw / 2) + p.styles.entity.corners
        attrs.g.transform.baseVal.getItem(0).setTranslate(attrX, h);

        var text = svgEl(g, "text", {
            'text-anchor': 'middle',
            x: oldw / 2,
            y: h / 2 + 5,
            'stroke-width': 0
        })
        text.textContent = p.getErAttr(node, "name")
        var textW = text.getBoundingClientRect().width
        var oldw = w
        if (w < (textW + p.styles.entity.padding * 2)) {
            w = (textW + p.styles.entity.padding * 2)
            rectx -= (w - oldw) / 2
        }
        var rect = svgEl(g, "rect", {
            height: h,
            width: w,
            fill: "#ffffff",
            'stroke-width': 1,
            x: rectx,
            y: 0
        })
        mkFirstChild(rect)
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
    this.selectOn = function() {
        var g = this.getG()
        g.style.stroke = p.styles.selectedStroke
    }
    this.selectOff = function() {
        var g = this.getG()
        g.style.stroke = p.styles.normalStroke
    }
    this.getCenter = function() {
        var x = parseInt(p.getViewAttr(node, "x"))
        var y = parseInt(p.getViewAttr(node, "y"))
        var w = parseInt(p.getViewAttr(node, "w"))
        var h = parseInt(p.getViewAttr(node, "h"))
        return [x + w / 2, y + h / 2]
    }
}

//New entity
function newEntity(ev) {
    var name = "Entity"
    var el = erp.mkErElement("entity", erp.schema)
    var pos = erp.getMouseInDocument(ev)
    var h = erp.styles.entity.defaultH
    var w = erp.styles.entity.defaultW
    erp.setViewAttr(el, "x", pos.x - w / 2)
    erp.setViewAttr(el, "y", pos.y - h / 2)
    erp.setViewAttr(el, "h", h)
    erp.setViewAttr(el, "w", w)
    var c = new Concept(el, erp)
    c.setName(name)
    erp.addState()
    erp.selection.set([el.getAttribute("id")])
}

var entityNameInput = document.getElementById("entityNameInput")
entityNameInput.addEventListener("change", function(ev) {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.concept.setName(this.value)
    erp.addState()
})

var entityAttrTable = document.getElementById("entityAttrTable")
var entityAddAttr = document.getElementById("entityAddAttr")

function updateEntityPanel() {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    entityNameInput.value = e.concept.getName()
    clearElement(entityAttrTable)
    var attrs = e.concept.getAttrs()
    for (var x in attrs) {
        var attr = attrs[x]
        mkAttrRow(attr, entityAttrTable, updateEntityPanel)
            //using function call to capture "attr" in closures
    }
}


function entityAddAttribute() {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.concept.addAttribute("attribute", false)
    erp.addState()
    updateEntityPanel()
}