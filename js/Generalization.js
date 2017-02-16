function Generalization(node, project) {
    Concept.apply(this, [node, project])
    this.type = "Generalization"
    var p = this.project
    this.destroy = function() {
        //destruction frees entities from the generalization
        var p = this.getParent()
        this.node.parentNode.appendChild(p.node) //might be another generalization
        var ch = this.getChildren()
        for (var x in ch) {
            erp.schema.appendChild(ch[x].node)
        }
        //then copy super's destructor
        killNode(this.node)
        this.project.schedule("refClean")
        this.node = null
    }
    this.setXY = function(x, y) {
        //a generalization does not have a position itself:
        //instead, it relies on the position of its parent concept.
        this.getParent().setXY(x, y)
    }
    this.getReservedSlotXY = function(n, pos) {
        return this.getParent().getReservedSlotXY(n, pos)
    }
    this.getRect = function(n, pos) {
        return this.getParent().getRect()
    }
    this.getPC = function() {
        return this.node.getElementsByTagNameNS(p.ns, "parent-concept")[0]
    }
    this.getCC = function() {
        return this.node.getElementsByTagNameNS(p.ns, "children-concepts")[0]
    }
    this.getParent = function() {
        try {
            var nodes = this.getPC().childNodes
            for (var x = 0; x < nodes.length; x++) {
                if (nodes[x].nodeType == Node.ELEMENT_NODE) {
                    return p.wrap(nodes[x])
                }
            }
        } catch (e) {
            console.log(e)
            return null
        }
    }
    this.getChildren = function() {
        try {
            var nodes = this.getCC().childNodes
            var ret = []
            for (var x = 0; x < nodes.length; x++) {
                if (nodes[x].nodeType == Node.ELEMENT_NODE) {
                    ret.push(p.wrap(nodes[x]))
                }
            }
            return ret
        } catch (e) {
            console.log(e)
            return null
        }
    }
    this.setParent = function(pnode) {
        var pc = this.getPC()
        clearElement(pc)
        pc.appendChild(pnode)
    }
    this.addChild = function(cnode) {
        var cc = this.getCC()
        cc.appendChild(cnode)
    }
    this.removeChild = function(cnode) {
        var cc = this.getCC()
        cc.removeChild(cnode)
    }
    this.draw = function(parent, reserveSlotsBelow, reserveSlotsAbove) {
        var g = svgEl(parent, "g", {
            id: "svg-" + this.getId(),
            "stroke": p.styles.normalStroke
        })
        var pEl = this.getParent()
        reserveSlotsAbove = reserveSlotsAbove || 0
        pEl.draw(g, 1, reserveSlotsAbove) //we reserve a slot below to connect the arrow
        var pCenter = pEl.getCenter()
        var ch = this.getChildren()

        var childrenG = svgEl(g, "g")

        //foreach child, we draw it in place;
        var oldw = 0
        var posx = pCenter[0]
        var posy = pCenter[1] + p.styles.generalization.height
        for (var x in ch) {
            ch[x].setXY(posx, posy)
            ch[x].draw(childrenG, 0, 1) //we reserve a slot above to connect to the arrow
        }
        //foreach child, we redraw it translated just enough
        var skip = 1
        for (var x in ch) {
            var bbox = ch[x].getG().getBoundingClientRect()
            var rbbox = ch[x].getRect().getBoundingClientRect()
            var w = rbbox.width / p.zoom
            if (!skip) {
                posx += w / 2
            } else {
                skip -= 1
            }
            ch[x].setXY(posx, posy)
            killNode(ch[x].getG())
            ch[x].draw(childrenG, 0, 1)
            posx += (bbox.width / p.zoom - (w / 2)) + p.styles.generalization.margin
        }
        //draw lines:
        //draw arrow
        var xy = pEl.getReservedSlotXY(1, "below")
        var d = "M" + xy[0] + "," + xy[1] + "l-5,8 m 5,-8 l5,8"
            //descend to horizontal line level
        var genNode = [xy[0], pCenter[1] + p.styles.generalization.horizHeight]
        d += "M" + xy[0] + "," + xy[1] + " L" + genNode[0] + "," + genNode[1] + " "
        for (var x in ch) {
            var chxy = ch[x].getReservedSlotXY(1, "above")
            d += "M" + genNode[0] + "," + genNode[1]
            d += "L" + chxy[0] + "," + genNode[1]
            d += "L" + chxy[0] + "," + chxy[1]
        }
        var pathg = svgEl(g, "g")
        svgEl(pathg, "path", { d: d, "stroke-width": 2, "fill": "none" })
        svgEl(pathg, "path", { d: d, "stroke-width": 16, "stroke-opacity": 0, "fill": "none" })
        var that = this
        pathg.addEventListener("click", function(ev) {
            p.selection.clicked(that, ev)
        })
    }
}

function genTravelUp(node) {
    while (node != erp.schema && node.localName != "generalization") {
        node = node.parentNode
    }
    return node
}

function newGeneralization(objs) {
    //add the first selected object as parent and subsequent ones as children
    var up = genTravelUp(objs[0].node)
    var el = null
    if (up.localName == "generalization" && objs[0].node.parentNode.localName == "parent-concept") {
        //this is already a generalization;
        el = up
    } else {
        if (up != erp.schema) {
            up = objs[0].node.parentNode
        }
        el = erp.mkErElement("generalization", up)
        var pc = erp.mkErElement("parent-concept", el)
        var cc = erp.mkErElement("children-concepts", el)
    }
    var g = new Generalization(el, erp)

    g.setParent(objs[0].node)
    for (var x = 1; x < objs.length; x++) {
        //travel upward to know if we are in a generalization
        var up = genTravelUp(objs[x].node)
        if (up.localName == "generalization") {
            g.addChild(up)
        } else {
            g.addChild(objs[x].node)
        }
    }
    erp.addState()
        //erp.selection.set([el.getAttribute("id")])
}