"use strict";

function Concept(node, project) {
    this.node = node
    this.project = project
    this.setName = function(name) {
        this.node.setAttributeNS(this.project.ns, "name", name)
    }
    this.getG = function() {
        return this.project.svg.getElementById('svg-' + this.getId())
    }
    this.getId = function() {
        return this.node.getAttribute("id")
    }
    this.getName = function() {
        return this.node.getAttributeNS(this.project.ns, "name")
    }
    this.getAttrs = function() {
        var l = []
        var attrs = this.node.getElementsByTagNameNS(this.project.ns, "attr")
        for (var i = 0; i < attrs.length; i++) {
            var el = attrs[i]
            var wrapper = new Attr(el, this.project)
            l.push(wrapper)
        }
        return l
    }
    this.addAttribute = function(name, isPrimary) {
        var p = this.project
        var attr = new Attr(p.mkErElement("attr", this.node), p)
        attr.setName(name)
        attr.setIsPrimary(isPrimary)
    }
    this.destroy = function() {
        killNode(this.node)
        this.project.schedule("refClean")
        this.node = null
    }
    this.moveUp = function() {
        mkLastChild(this.node)
    }
    this.getXY = function() {
        var x = parseFloat(this.project.getViewAttr(this.node, "x"))
        var y = parseFloat(this.project.getViewAttr(this.node, "y"))
        return [x, y]
    }
    this.moveRelXY = function(x, y) {
        var xy = this.getXY()
        var curx = xy[0] + x / this.project.zoom
        var cury = xy[1] + y / this.project.zoom
        var g = this.getG()
        g.transform.baseVal.getItem(0).setTranslate(max(curx, 0), max(cury, 0))
    }
}



//Common between Entity and Relation
function mkAttrRow(attr, tbody, fnRefresh) {
    var name = attr.getName()
    var primary = attr.getIsPrimary()
    var tr = mkEl(tbody, "tr")
    var td = mkEl(tr, "td")
    var checkbox = mkEl(td, "input", {
        type: "checkbox",
        autocomplete: "off",
        title: "Primary"
    })
    if (primary) {
        checkbox.setAttribute("checked", "true")
    }
    checkbox.addEventListener("change", function(ev) {
        attr.setIsPrimary(this.checked)
        erp.addState()
    })
    var td2 = mkEl(tr, "td")
    var attrNameInput = mkEl(td2, "input", {
        type: "text",
        value: name,
        "style": "width: 150px; float:right"
    })
    attrNameInput.addEventListener("change", function() {
        attr.setName(this.value)
        erp.addState()
    })

    var up = mkEl(td, "div", { "class": "upAttr" })
    up.addEventListener("click", function() {
        attr.moveUp()
        erp.addState()
        fnRefresh()
    })
    var del = mkEl(td, "div", { "class": "deleteAttr" })
    del.addEventListener("click", function() {
        attr.destroy()
        erp.addState()
        fnRefresh()
    })
    var down = mkEl(td, "div", { "class": "downAttr" })
    down.addEventListener("click", function() {
        attr.moveDown()
        erp.addState()
        fnRefresh()
    })
}


function drawAttrs(parent, attrs, style, additionalSpace) {
    additionalSpace = additionalSpace || 0
    var ret = {}
    var g = ret.g = svgEl(parent, "g", {
        "transform": "translate(0,0)"
    })
    var n = attrs.length
    var spacing = style.attrSpacing
    var lineh = style.attrLineH + additionalSpace
    var rad = style.attrCircRad
    var posx = 0
    for (var i = 0; i < n; i++) {
        var att = attrs[i]
        var path = svgEl(g, "path", {
            "d": "M" + posx + ",0 l0," + lineh
        })
        var circle = svgEl(g, "circle", {
            cy: lineh + 2 + rad / 2,
            cx: posx,
            r: rad,
            'stroke-width': '1',
            fill: att.getIsPrimary() ? style.primaryFill : 'none'
        })
        var texty = lineh + style.attrOffset
        var textx = posx - style.attrDist
        var text = svgEl(g, "text", {
            x: textx,
            y: texty,
            'font-family': erp.styles.defaultFont,
            "font-size": style.attrFontSize,
            "stroke": 'none',
            "stroke-width": "0",
            'text-anchor': 'end',
            'transform': "rotate(" + style.attrRotationDeg + "," + posx + "," + texty + ")"
        })
        text.textContent = att.getName()
        posx += spacing
    }
    ret.reqWidth = posx - spacing
    return ret
}