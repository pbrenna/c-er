"use strict";

function IsA(node, project) {
    this.node = node
    this.project = project
    this.type = "IsA"
    var p = project
    var n = node
    this.destroy = function() {
        killNode(this.node)
        this.project.refCleanScheduled = true
        this.node = null
    }
    this.getId = function() {
        return this.project.getElId(this.node)
    }
    this.selectOn = function() {
        this.getG().style.stroke = this.project.styles.selectedStroke
    }
    this.getG = function() {
        return this.project.svg.getElementById('svg-' + this.getId())
    }
    this.selectOff = function() {
        this.getG().style.stroke = this.project.styles.normalStroke
    }
    this.getParent = function() {
        return p.get(p.getErAttr(this.node, "ref-parent"))
    }
    this.getChild = function() {
        return p.get(p.getErAttr(this.node, "ref-child"))
    }
    this.draw = function(parent) {
        var cb = new Callback(function() {
            var g = svgEl(parent, "g", {
                id: "svg-" + this.getId(),
                stroke: this.project.styles.normalStroke
            })
            var par = this.getParent()
            var ch = this.getChild()
            var parCenter = par.getCenter()
            var chCenter = ch.getCenter()
            var line = [parCenter, chCenter]
            var line_inters = par.lineIntersect(line)
            var arrowd = "M" + line_inters[0][0] + "," + line_inters[0][1] + "l -8,-5 m 8 5 l -8,5 m8,-5"
            var lineInc = getLineInclination(line)
            svgEl(g, "path", {
                "stroke-width": "2",
                "d": arrowd,
                "transform": "rotate(" + lineInc + "," + line_inters[0][0] + "," + line_inters[0][1] + ")"
            })
            var pathd = "M" + line_inters[0][0] + "," + line_inters[0][1] + "L" + chCenter[0] + "," + chCenter[1]
            svgEl(g, "path", {
                "stroke-width": 2,
                d: pathd
            })
            svgEl(g, "path", {
                "stroke-width": 16,
                d: pathd,
                "stroke-opacity": 0
            })
            ch.moveUp()
            var that = this
            g.addEventListener("mousedown", function(ev) {
                that.project.selection.clicked(that, ev)
            })
        }, this, [])
        p.scheduleDraw(cb)
    }
}


function newIsA(e1, e2) {
    var el = erp.mkErElement("is-a", erp.schema, {
        "ref-parent": e2.getId(),
        "ref-child": e1.getId()
    })
    erp.addState()
    erp.selection.set([el.getAttribute("id")])
}