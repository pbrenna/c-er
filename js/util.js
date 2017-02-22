"use strict";

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
            var a = cb.funcArgs
            a.push(isXML ? this.responseXML : this.responseText)
            cb.func.apply(cb.funcThis, a)
        }
    };
    xhttp.open("GET", url, true)
    xhttp.send()
}



//drag
var dragging = null
document.addEventListener("mousemove", function(ev) {
    if (dragging != null) {
        for (var x in dragging) {
            try {
                var d = dragging[x]
                if (d.dragX && d.dragY) {
                    d.moveRelXY(ev.clientX - d.startX, ev.clientY - d.startY)
                } else if (d.dragX) {
                    d.moveRelX(ev.clientX - d.startX)
                } else if (d.dragY) {
                    d.moveRelY(ev.clientY - d.startY)
                }
            } catch (e) { console.log(e) }
        }
    }
})
document.addEventListener("mouseup", function(ev) {
    if (dragging != null) {
        for (var x in dragging) {
            try {
                var d = dragging[x]
                if (d.dragX && d.dragY) {
                    d.endDragXY(ev.clientX - d.startX, ev.clientY - d.startY)
                } else if (d.dragX) {
                    d.endDragX(ev.clientX - d.startX)
                } else if (d.dragY) {
                    d.endDragY(ev.clientY - d.startX)
                }
            } catch (e) { console.log(e) }
        }
        dragging = []
    }
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
window.addEventListener("beforeunload", function(ev) {
    console.log("beforeunload")
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