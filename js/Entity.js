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
    this.concept.node.persist = this.concept.node.persist || {}
    var persist = this.concept.node.persist

    var node = this.concept.node

    //drawing things
    this.draw = function(parent) {
        var x = parseInt(p.getViewAttr(node, "x"))
        var y = parseInt(p.getViewAttr(node, "y"))
        var w = parseInt(p.getViewAttr(node, "w"))
        var h = parseInt(p.getViewAttr(node, "h"))
        if (x === null || y === null || !h || !w)
            throw new DOMException("missing x,y coordinates of entity")
        var g = persist.g = svgEl(parent, "g", {
            transform: "translate(" + x + "," + y + ")",
            stroke: p.styles.normalStroke
        })
        var text = svgEl(g, "text", {
            'text-anchor': 'middle',
            x: w / 2,
            y: h / 2 + 5,
            'stroke-width': 0
        })
        text.textContent = p.getErAttr(node, "name")
        var textW = text.getBoundingClientRect().width
        var oldw = w
        var rectx = 0
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
            erp.dragStart(that, ev)
        })

        g.addEventListener("click", function(ev) {
            p.selection.clicked(that, ev)
        })
        rect.addEventListener("dblclick", function() { that.editName() })
        text.addEventListener("dblclick", function() { that.editName() })
    }
    this.moveRelXY = function(x, y) {
        var curx = parseInt(p.getViewAttr(node, "x"))
        var cury = parseInt(p.getViewAttr(node, "y"))
        persist.g.transform.baseVal.getItem(0).setTranslate(curx + x, cury + y);
    }
    this.endDragXY = function(x, y) {
        var curx = parseInt(p.getViewAttr(node, "x")) + x
        var cury = parseInt(p.getViewAttr(node, "y")) + y
        if (x != 0 || y != 0) {
            p.setViewAttr(node, "x", curx)
            p.setViewAttr(node, "y", cury)
            p.patchState(this.addStateNumber)
        }
    }
    this.selectOn = function() {
        persist.g.style.stroke = p.styles.selectedStroke
    }
    this.selectOff = function() {
        persist.g.style.stroke = p.styles.normalStroke
    }
    this.editName = function() {
        var newname = prompt("Nuovo nome:", this.concept.getName())
        if (newname)
            this.concept.setName(newname)
        p.addState()
    }
}

//editing operations
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

function entityDialogSubmit(form) {
    var dialogContent = document.getElementById("entityDialog");

}