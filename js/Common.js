function ERObject(node, project) {
    this.node = node
    this.project = project
    this.getG = function() {
        return this.project.svg.getElementById('svg-' + this.getId())
    }
    this.getId = function() {
        return this.node.getAttribute("id")
    }
}

function Selectable(nStroke, sStroke) {
    nStroke = nStroke || this.project.styles.defaultStrokeWidth
    sStroke = sStroke || this.project.styles.selectedStrokeWidth
    this.selectOn = function() {
        try {
            var g = this.getG()
            g.style.stroke = this.project.styles.selectedStroke
            g.style.strokeWidth = sStroke
        } catch (e) {}
    }
    this.selectOff = function() {
        try {
            var g = this.getG()
            g.style.stroke = this.project.styles.normalStroke
            g.style.strokeWidth = nStroke
        } catch (e) {}
    }
}

function Draggable() {
    this.moveRelXY = function(x, y) {
        if (this.isFree()) {
            var xy = this.getXY()
            var curx = xy[0] + x / this.project.zoom
            var cury = xy[1] + y / this.project.zoom
            this.updateTranslate(curx, cury)
        }
    }
    this.endDragXY = function(dx, dy) {
        var xy = this.getXY()
        var curx = xy[0] + dx / this.project.zoom
        var cury = xy[1] + dy / this.project.zoom

        var newCenter = this.project.alignToGrid(curx, cury)
        var curx = newCenter[0]
        var cury = newCenter[1]
        if (curx - xy[0] != 0 || cury - xy[1] != 0) {
            this.project.setViewAttr(this.node, "x", max(curx, 0))
            this.project.setViewAttr(this.node, "y", max(cury, 0))
            this.project.patchState(this.addStateNumber)
        } else {
            this.project.update()
        }
    }
    this.isFree = function() {
        return true
    }
    this.updateTranslate = function(x, y) {
        var g = this.getG()
        g.transform.baseVal.getItem(0).setTranslate(max(x, 0), max(y, 0))
    }
}