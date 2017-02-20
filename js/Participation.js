"use strict";

function Participation(node, project) {
    this.node = node
    this.project = project
    this.type = "Participation"
    this.setEntity = function(entity) {
        console.assert(entity instanceof Entity)
        this.node.setAttributeNS(this.project.ns, "ref-entity", entity.getId())
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
    this.getMandatory = function() {
        return this.node.hasAttributeNS(this.project.ns, "mandatory") &&
            this.node.getAttributeNS(this.project.ns, "mandatory") == "true"
    }
    this.setMandatory = function(r) {
        this.project.setErAttr(this.node, "mandatory", r ? "true" : "false")
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
        //schedule for execution after main drawing pass
        //so that all entities and relationships have been drawn
        var cb = new Callback(function() {
            var rel = this.project.wrap(this.node.parentNode).getCenter()
            var entId = this.project.getErAttr(this.node, "ref-entity")
            var ent = this.project.get(entId)
            var entc = ent.getCenter()
            var g = svgEl(parent, "g", {
                id: "svg-" + this.getId(),
                stroke: this.project.styles.normalStroke,
                'stroke-width': this.project.styles.lines.defaultStrokeWidth
            })

            var line = [rel, entc]
            var lineInc = getLineInclination(line)
            var line_inters = ent.lineIntersect(line)

            /*svgEl(parent, "path", {
                "stroke": "red",
                "stroke-width": "2",
                "d": arrowd,
                "transform": "rotate(" + lineInc + "," + ent_inters[0][0] + "," + ent_inters[0][1] + ")"
            })*/
            var d = "M " + entc[0] + "," + entc[1] + " L" + rel[0] + "," + rel[1]
            var path = svgEl(g, "path", {
                d: d,
            })
            var transp = svgEl(g, "path", {
                d: d,
                "stroke": "#000",
                "stroke-opacity": 0,
                "stroke-width": 16
            })
            if (this.getMandatory()) {
                //must be double
                //trick: draw a thicker path; then mask the inside
                //the mask is built overlaying a thin black path over a wide white path 
                var inW = this.project.styles.lines.defaultStrokeWidth * 2
                var outW = inW * 2
                var defs = this.project.svg.getElementById("defs")
                var maskid = "svg-" + this.getId() + "-mask"
                var maskx = 0,
                    masky = 0,
                    maskw = "100%",
                    maskh = "100%"
                var mask = svgEl(defs, "mask", {
                    id: maskid,
                    maskUnits: "userSpaceOnUse",
                    x: maskx,
                    y: masky,
                    height: maskh,
                    width: maskw,
                    maskContentUnits: "userSpaceOnUse",
                })
                svgEl(mask, "path", {
                    d: d,
                    stroke: "white",
                    'stroke-width': outW
                })
                svgEl(mask, "path", {
                    d: d,
                    stroke: "black",
                    'stroke-width': inW
                })
                path.setAttribute("mask", 'url(#' + maskid + ')')
                path.setAttribute("stroke-width", outW)
                    /*svgEl(g, "path", {
                        d: d,
                        stroke: 'white',
                        'stroke-width': this.project.styles.lines.defaultStrokeWidth
                    })*/
            }
            if (lineInc < 0) lineInc += 360
            var baseline = lineInc >= 180 ? "auto" : "hanging"
            var anchor = (lineInc + 90) % 360 >= 180 ? "end" : "start"
            var tinc = lineInc % 180
            if (tinc >= 90) tinc -= 180
            if (lineInc == 90) {
                tinc = 90;
                anchor = "start"
            }
            var dy = lineInc >= 180 ? -7 : 2
            var dx = anchor == "end" ? -5 : 5
            var txt = svgEl(g, "text", {
                x: line_inters[0][0] + dx,
                y: line_inters[0][1] + dy,
                'transform': 'rotate(' + tinc + ',' + line_inters[0][0] + ',' + (line_inters[0][1]) + ')',
                'text-anchor': anchor,
                'dominant-baseline': baseline,
                "stroke-width": 0,
                'font-size': this.project.styles.participation.fontSize,
                'font-family': this.project.styles.defaultFont
            })
            var r
            if (r = this.getRole()) {
                txt.textContent = this.getRole() + ", "
            }
            txt.textContent += this.getMultMin() + ":" + this.getMultMax()
                /* var box = txt.getBoundingClientRect()
                 var bgrect = svgEl(g, "rect", {
                     fill: "white",
                     x: box.left / p.zoom + scroller.scrollLeft / p.zoom,
                     y: box.top / p.zoom + scroller.scrollTop / p.zoom,
                     width: box.width / p.zoom,
                     height: box.height / p.zoom,
                     "stroke-width": 0
                 })
                 mkFirstChild(bgrect)*/
            mkFirstChild(path)
            mkFirstChild(g)
            var that = this
            g.addEventListener("mousedown", function(ev) {
                that.project.selection.clicked(that, ev)
            })
        }, this, [])
        p.scheduleDraw(cb)
    }
    this.selectOn = function() {
        var g = this.getG()
        g.style.stroke = this.project.styles.selectedStroke
        g.style.strokeWidth = this.project.styles.lines.selectedStrokeWidth
    }
    this.selectOff = function() {
        var g = this.getG()
        g.style.stroke = this.project.styles.normalStroke
        g.style.strokeWidth = this.project.styles.lines.defaultStrokeWidth
    }
    this.getRole = function() {
        return p.getErAttr(this.node, "role") || ""
    }
    this.setRole = function(role) {
        p.setErAttr(this.node, "role", role)
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
var partRole = document.getElementById("participationRole")
var multMax = document.getElementById("participationMultMax")
var multMin = document.getElementById("participationMultMin")
var partMandatory = document.getElementById("participationMandatory")
partRole.addEventListener("change", function() {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.setRole(this.value)
    erp.addState()
})
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
partMandatory.addEventListener("change", function() {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    e.setMandatory(this.checked)
    erp.addState()
})


function updateParticipationPanel() {
    var id = erp.selection.s[0]
    var e = erp.get(id)
    partRole.value = e.getRole()
    multMin.value = e.getMultMin()
    multMax.value = e.getMultMax()
    partMandatory.checked = e.getMandatory()
}