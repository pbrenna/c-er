"use strict";
/*
 * util.js
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


function killNode(node) {
    node.parentNode.removeChild(node)
}

//network & callbacks
function Callback(func, funcThis, funcArgs) {
    this.func = func
    this.funcThis = funcThis
    this.funcArgs = funcArgs
    this.exec = function(moreArgs) {
        this.func.apply(this.funcThis, this.funcArgs.concat(moreArgs))
    }
}

function ajaxGet(url, cb, isXML) {
    var xhttp = new XMLHttpRequest()
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            cb.exec(isXML ? this.responseXML : this.responseText)
        }
    };
    xhttp.open("GET", url, true)
    xhttp.send()
}



//drag
var dragging = null

function moveFunc(cx, cy) {
    if (dragging != null) {
        for (var x in dragging) {
            try {
                var d = dragging[x]
                d.moveRelXY(cx - d.startX, cy - d.startY)
            } catch (e) { console.log(e) }
        }
    }
}
document.addEventListener("mousemove", function(ev) {
    moveFunc(ev.clientX, ev.clientY)
})
document.addEventListener("touchmove", function(ev) {
    var t = ev.touches[0]
    moveFunc(t.clientX, t.clientY)
    if (dragging.length > 0) {
        ev.preventDefault()
    }
})

function endFunc(cx, cy) {
    if (dragging != null) {
        for (var x in dragging) {
            try {
                var d = dragging[x]
                d.endDragXY(cx - d.startX, cy - d.startY)
            } catch (e) { console.log(e) }
        }
        dragging = []
    }
}
document.addEventListener("mouseup", function(ev) {
    endFunc(ev.clientX, ev.clientY)
})
document.addEventListener("touchend", function(ev) {
    var t = ev.changedTouches[0]
    endFunc(t.clientX, t.clientY)
})

function showDialog(d) {
    d.className = "dialogContent visible"
    document.getElementById("dialogContainer").className = "visible"
}

function closeDialog() {
    document.getElementById("dialogContainer").className = ""
    var c = document.getElementsByClassName("dialogContent visible")
    for (var x in c) {
        c[x].className = "dialogContent"
    }
}

function field(id) {
    return document.getElementById(id).value
}

function clearElement(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild)
    }
}
var svgNS = "http://www.w3.org/2000/svg"

function svgEl(parent, name, attrDict, dontAppend) {
    var el = document.createElementNS(svgNS, name)
    for (var attr in attrDict) {
        el.setAttribute(attr, attrDict[attr])
    }
    if (!dontAppend)
        parent.appendChild(el)
    return el
}

function getSvgAttr(el, attrName) {
    return el.getAttributeNS(svgNS, attrName)
}

function setSvgAttr(el, attrName, val) {
    return el.setAttributeNS(svgNS, attrName, val)
}

function mkFirstChild(el) {
    var p = el.parentNode
    if (el != p.firstChild) {
        p.insertBefore(el, p.firstChild)
    }
}

function mkLastChild(el) {
    el.parentNode.appendChild(el)
}

function preventBrowserDrag(el) {
    el.addEventListener('dragstart', function(ev) {
        ev.preventDefault()
        return false
    })
}

function mkEl(parent, name, attrDict, dontAppend) {
    var el = document.createElement(name)
    for (var attr in attrDict) {
        el.setAttribute(attr, attrDict[attr])
    }
    if (!dontAppend)
        parent.appendChild(el)
    return el
}

function min(a, b) {
    return a < b ? a : b
}

function max(a, b) {
    return a > b ? a : b
}
var scroller = document.getElementById('scroller')
scroller.addEventListener("scroll", function(ev) {
    if (dragging && dragging.length > 0) {
        ev.preventDefault()
    }
})
window.addEventListener("beforeunload", function(ev) {
    if (!erp.saved) {
        ev.returnValue = "Are you sure? The diagram wasn't saved!"
        return ev.returnValue
    }
})

function intersectCalc(line, lines) {
    var res = []
    for (var l in lines) {
        var int = intersect2lines(line, lines[l])
        if (int != null)
            res.push(int)
    }
    return res
}

function intersect2lines(l1, l2) {
    var x1 = l1[0][0],
        x2 = l1[1][0],
        x3 = l2[0][0],
        x4 = l2[1][0],
        y1 = l1[0][1],
        y2 = l1[1][1],
        y3 = l2[0][1],
        y4 = l2[1][1]
    var den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    if (den == 0)
        return null
    var numx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)
    var numy = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)

    var posx = numx / den,
        posy = numy / den
    if ((posx <= x1 + 1 && posx >= x2 - 1 || posx <= x2 + 1 && posx >= x1 - 1) &&
        (posy <= y1 + 1 && posy >= y2 - 1 || posy <= y2 + 1 && posy >= y1 - 1) &&
        (posx <= x3 + 1 && posx >= x4 - 1 || posx <= x4 + 1 && posx >= x3 - 1) &&
        (posy <= y3 + 1 && posy >= y4 - 1 || posy <= y4 + 1 && posy >= y3 - 1))
        return [posx, posy]
    else
        return null
}

function getLineInclination(line) {
    var x1 = line[0][0],
        x2 = line[1][0],
        y1 = line[0][1],
        y2 = line[1][1]
    return Math.atan2((y1 - y2), (x1 - x2)) * (180 / Math.PI)
}
//http://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

function baseName(s) {
    var lastSlash = max(s.lastIndexOf("/"), s.lastIndexOf("\\"))
    var nameStart = lastSlash + 1 //if lastSlash == -1, everithing is fine
    var name = s.substring(nameStart)
    name = name.replace(".er.xml", "").replace(".xml", "")
    return name
}
