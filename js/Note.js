function Note(node, project) {
    this.node = n = node
    this.project = p = project
    this.type = "Note"
    this.getXY = this.getCenter = function() {
        var x = parseInt(p.getViewAttr(n, "x")),
            y = parseInt(p.getViewAttr(n, "y"))
        return [x, y]
    }
    this.getG = function() {
        return this.project.svg.getElementById('svg-' + this.getId())
    }
    this.draw = function(parent) {
        var cnt = this.getContent()
        var xy = this.getXY()
        var g = svgEl(parent, "g", {
            id: "svg-" + this.getId(),
            stroke: p.styles.normalStroke,
            'stroke-width': p.styles.defaultStrokeWidth
        })
        var txt = svgEl(g, "text", {
            x: 0,
            y: 0,
            stroke: 'none',
            fontSize: p.styles.note.fontSize
        })
        var spl = cnt.split("\n")
        for (var x in spl) {
            var line = spl[x]
            var sp = svgEl(txt, "tspan", {
                dy: p.styles.note.fontSize + 2,
                x: 0
            })
            sp.textContent = line
        }
        var bbox = txt.getBoundingClientRect()
        var reqw = bbox.width / p.zoom
        var reqh = bbox.height / p.zoom

        var pathx = Math.round(-reqw / 2 - p.styles.note.padding) - .5,
            pathy = Math.round(-reqh / 2 - p.styles.note.padding) - .5,
            pathh = Math.round(reqh + p.styles.note.padding * 2),
            pathw = Math.round(reqw + p.styles.note.padding * 2),
            corner = 10
        var path = svgEl(g, "path", {
            d: "M" + pathx + "," + pathy + "h" + (pathw - corner) +
                "l" + corner + "," + corner +
                "v" + (pathh - corner) + "h-" + pathw +
                "z m" + (pathw - corner) + ",0 v" + corner + "h" + corner,
            fill: "#fff",
            'fill-rule': "evenodd"
        })
        mkFirstChild(path)
        var tr2 = p.svg.createSVGTransform()
        tr2.setTranslate(-reqw / 2, -reqh / 2)
        txt.transform.baseVal.appendItem(tr2)
        var tr = p.svg.createSVGTransform()
        tr.setTranslate(xy[0], xy[1])
        g.transform.baseVal.appendItem(tr)

        var that = this
        var startFunc = function(ev) {
            mkLastChild(this)
            that.bringUp()
            p.dragStart(that, ev)
        }
        g.addEventListener('mousedown', startFunc)
        g.addEventListener('touchstart', startFunc)
    }
    this.setContent = function(cnt) {
        n.textContent = cnt
    }
    this.getContent = function() {
        return n.textContent.split("\t").join("")
    }
    this.getId = function() {
        return this.project.getElId(this.node)
    }
    this.selectOn = function() {
        var g = this.getG()
        g.style.stroke = this.project.styles.selectedStroke
        g.style.strokeWidth = this.project.styles.selectedStrokeWidth
    }
    this.selectOff = function() {
        var g = this.getG()
        g.style.stroke = this.project.styles.normalStroke
        g.style.strokeWidth = this.project.styles.defaultStrokeWidth
    }
    this.destroy = function() {
        killNode(n)
        this.node = n = null
    }
    this.bringUp = function() {
        mkLastChild(n)
    }
    this.moveRelXY = function(dx, dy) {
        var xy = this.getXY()
        var curx = xy[0] + dx / this.project.zoom
        var cury = xy[1] + dy / this.project.zoom
        this.updateTranslate(curx, cury)
    }
    this.endDragXY = function(dx, dy) {
        var xy = this.getXY()
        var curx = xy[0] + dx / this.project.zoom
        var cury = xy[1] + dy / this.project.zoom

        var newCenter = this.project.alignToGrid(curx, cury)
        var curx = newCenter[0]
        var cury = newCenter[1]
        if (curx - xy[0] != 0 || cury - xy[1] != 0) {
            this.project.setViewAttr(node, "x", max(curx, 0))
            this.project.setViewAttr(node, "y", max(cury, 0))
            this.project.patchState(this.addStateNumber)
        } else {
            this.project.update()
        }
    }
    this.updateTranslate = function(x, y) {
        this.getG().transform.baseVal.getItem(0).setTranslate(x, y)
    }
    this.checkConsistency = function() {}
}

var noteContent = document.getElementById("noteContent")
noteContent.addEventListener("change", function(ev) {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.setContent(noteContent.value)
    erp.addState()
})

function newNote(ev) {
    var content = "Note bla bla"
    var el = erp.mkErElement("note", erp.schema)
    var pos = erp.getMouseInDocument(ev)
    var rounded = erp.alignToGrid(pos.x, pos.y)
    erp.setViewAttr(el, "x", rounded[0])
    erp.setViewAttr(el, "y", rounded[1])
    var n = new Note(el, erp)
    n.setContent(content)
    erp.addState()
    erp.selection.set([el.getAttribute("id")])
}

function updateNotePanel() {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    noteContent.value = e.getContent()
}