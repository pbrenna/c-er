"use strict";

function Participation(node, project) {
    this.node = node
    this.project = project
    this.type = "Participation"
    this.setEntity = function(entity) {
        console.assert(entity instanceof Entity)
        this.node.setAttributeNS(this.project.ns, "entity", entity.getId())
    }
    this.setMultMax = function(mult_max) {
        this.node.setAttributeNS(this.project.ns, "mult-max", mult_max)
    }
    this.setMultMin = function(mult_min) {
        this.node.setAttributeNS(this.project.ns, "mult-min", mult_min)
    }
    this.getMultMax = function() {
        return this.node.getAttributeNS(this.project.ns, "mult-max")
    }
    this.getMultMin = function() {
        return this.node.getAttributeNS(this.project.ns, "mult-min")
    }
    this.destroy = function() {
        killNode(this.node)
        this.node = null
    }
    this.getId = function() {
        return this.project.getElId(this.node)
    }
    this.getG = function() {
        return this.project.svg.getElementById('svg-' + this.getId())

    }
    var p = this.project
    this.draw = function(parent) {
        var rel = this.project.wrap(this.node.parentNode).getCenter()
        var entId = this.project.getErAttr(this.node, "entity")
        var ent = this.project.get(entId)
        var entc = ent.getCenter()
        var g = svgEl(parent, "g", {
            id: "svg-" + this.getId(),
            stroke: this.project.styles.normalStroke
        })

        /*var line = [
            [entc[0], entc[1]],
            [rel[0], rel[1]]
        ]
        var ent_inters = ent.lineIntersect(line)
        var arrowd = "M" + ent_inters[0][0] + "," + ent_inters[0][1] + "l -10,-10 m 10 10 l -10,10"
        var lineInc = getLineInclination(line)
        svgEl(parent, "path", {
            "stroke": "red",
            "stroke-width": "2",
            "d": arrowd,
            "transform": "rotate(" + lineInc + "," + ent_inters[0][0] + "," + ent_inters[0][1] + ")"
        })*/
        var d = "M " + entc[0] + "," + entc[1] + " L" + rel[0] + "," + rel[1]

        var path = svgEl(g, "path", {
            d: d,
            "stroke-width": 2
        })
        var transp = svgEl(g, "path", {
            d: d,
            "stroke": "#000",
            "stroke-opacity": 0,
            "stroke-width": 16
        })
        var txt = svgEl(g, "text", {
            x: (entc[0] + rel[0]) / 2 - 20,
            y: (entc[1] + rel[1]) / 2 + 20,
            "stroke-width": 0,
            'font-family': this.project.styles.defaultFont
        })
        txt.textContent = "(" + this.getMultMin() + ", " + this.getMultMax() + ")"
        var box = txt.getBoundingClientRect()
        var bgrect = svgEl(g, "rect", {
            fill: "white",
            x: box.left / p.zoom + scroller.scrollLeft / p.zoom,
            y: box.top / p.zoom + scroller.scrollTop / p.zoom,
            width: box.width / p.zoom,
            height: box.height / p.zoom,
            "stroke-width": 0
        })
        mkFirstChild(bgrect)
        mkFirstChild(path)
        mkFirstChild(g)
        var that = this
        g.addEventListener("mousedown", function(ev) {
            that.project.selection.clicked(that, ev)
        })
    }
    this.selectOn = function() {
        this.getG().style.stroke = this.project.styles.selectedStroke
    }
    this.selectOff = function() {
        this.getG().style.stroke = this.project.styles.normalStroke
    }
}

function newParticipation(obj1, obj2) {
    if (obj1.type == "Relationship") {
        var tmp = obj1
        obj1 = obj2
        obj2 = tmp
    }
    var p = obj2.addParticipation(obj1, "1", "n")
    var id = p.getId()
    erp.addState()
    erp.selection.set([id])
}
var multMax = document.getElementById("participationMultMax")
var multMin = document.getElementById("participationMultMin")
multMax.addEventListener("change", function(ev) {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.setMultMax(this.value)
    erp.addState()
})
multMin.addEventListener("change", function(ev) {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.setMultMin(this.value)
    erp.addState()
})


function updateParticipationPanel() {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    multMin.value = e.getMultMin()
    multMax.value = e.getMultMax()
}