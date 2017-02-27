"use strict";
/*
 * IsA.js
 * This file is part of c-er
 *
 * Copyright (C) 2017 - Pietro Brenna
 *
 * c-er is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * c-er is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with c-er. If not, see <http://www.gnu.org/licenses/>.
 */


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
        try { //isa might not be drawn if the entities overlap
            var g = this.getG()
            g.style.stroke = this.project.styles.selectedStroke
            g.style.strokeWidth = this.project.styles.lines.selectedStrokeWidth
        } catch (e) {}
    }
    this.getG = function() {
        return this.project.svg.getElementById('svg-' + this.getId())
    }
    this.selectOff = function() {
        try { //isa might not be drawn if the entities overlap
            var g = this.getG()
            g.style.stroke = this.project.styles.normalStroke
            g.style.strokeWidth = this.project.styles.lines.defaultStrokeWidth
        } catch (e) {}
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
                stroke: this.project.styles.normalStroke,
                "stroke-width": this.project.styles.lines.defaultStrokeWidth
            }, true)
            var par = this.getParent()
            var ch = this.getChild()
            var parCenter = par.getCenter()
            var chCenter = ch.getCenter()
            var line = [parCenter, chCenter]
            var line_inters = par.lineIntersect(line)
            if (line_inters.length < 1)
                return
            var arrowd = "M" + line_inters[0][0] + "," + line_inters[0][1] + "l -8,-5 m 8 5 l -8,5 m8,-5"
            var lineInc = getLineInclination(line)
            svgEl(g, "path", {
                "d": arrowd,
                "transform": "rotate(" + lineInc + "," + line_inters[0][0] + "," + line_inters[0][1] + ")"
            })
            var pathd = "M" + line_inters[0][0] + "," + line_inters[0][1] + "L" + chCenter[0] + "," + chCenter[1]
            svgEl(g, "path", {
                d: pathd
            })
            svgEl(g, "path", {
                "stroke-width": 16,
                d: pathd,
                "stroke-opacity": 0
            })
            var chG = ch.getG()
            chG.parentNode.insertBefore(g, chG)
            var that = this
            g.addEventListener("mousedown", function(ev) {
                that.project.selection.clicked(that, ev)
            })
        }, this, [])
        p.scheduleDraw(cb)
    }
    this.checkConsistency = function() {

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
