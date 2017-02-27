"use strict";
/*
 * Note.js
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


function Note(node, project) {

    ERObject.apply(this, [node, project])
    Selectable.apply(this)
    Draggable.apply(this)
    SimpleDestroyable.apply(this)
    var n = node
    var p = project
    this.type = "Note"
    this.getXY = this.getCenter = function() {
        var x = parseInt(p.getViewAttr(n, "x")),
            y = parseInt(p.getViewAttr(n, "y"))
        return [x, y]
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
    this.bringUp = function() {
        mkLastChild(n)
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