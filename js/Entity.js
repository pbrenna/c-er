function Entity(concept) {
    this.concept = concept
    this.destroy = function() {
        this.concept.destroy()
        this.concept = null
    }

    var p = this.concept.project
    this.concept.node.persist = this.concept.node.persist || {}
    var persist = this.concept.node.persist

    //drawing things
    this.draw = function(parent) {
        var node = this.concept.node
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
        if (w < (textW + p.styles.padding * 2)) {
            w = (textW + p.styles.padding * 2)
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
        g.addEventListener('dragstart', function(ev) {
            ev.preventDefault()
            return false
        })
        g.addEventListener('mousedown', function(ev) {
            g.curx = parseInt(p.getViewAttr(node, "x"))
            g.cury = parseInt(p.getViewAttr(node, "y"))
            dragging = g
            dragging.x = true
            dragging.y = true
            dragging.startx = ev.clientX
            dragging.starty = ev.clientY
        })
        g.moveRelXY = function(x, y) {
            g.transform.baseVal.getItem(0).setTranslate(g.curx + x, g.cury + y);
        }
        g.endDragXY = function(x, y) {
            if (x != 0 || y != 0) {
                g.curx = x + g.curx
                g.cury = y + g.cury
                p.setViewAttr(node, "x", g.curx)
                p.setViewAttr(node, "y", g.cury)
                p.addState()
            }
        }
        var that = this
        g.addEventListener("mousedown", function(ev) {
            p.selection.clicked(that)
        })
        rect.addEventListener("dblclick", function() { that.editName() })
        text.addEventListener("dblclick", function() { that.editName() })
    }
    this.selectOn = function() {
        persist.g.style.stroke = p.styles.selectedStroke
    }
    this.selectOff = function() {
        persist.g.style.stroke = p.styles.normalStroke
    }
    this.editName = function() {
        this.concept.setName(prompt("Nuovo nome:", this.concept.getName()))
        p.addState()
    }
}

//editing operations
function newEntity() {
    var dialogContent = document.getElementById("entityDialog");
    showDialog(dialogContent);
}

function entityDialogSubmit(form) {
    var dialogContent = document.getElementById("entityDialog");
    var name = field("entityDialogName")
    var el = erp.mkErElement("entity", erp.schema)
    erp.setViewAttr(el, "x", 10)
    erp.setViewAttr(el, "y", 10)
    erp.setViewAttr(el, "h", 40)
    erp.setViewAttr(el, "w", 100)
    var c = new Concept(el, erp)
    c.setName(name)
    closeDialog(dialogContent)
    erp.addState()
}