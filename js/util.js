function killNode(node) {
    node.parentNode.removeChild(node)
}

//network & callbacks
function Callback(func, funcThis, funcArgs) {
    this.func = func
    this.funcThis = funcThis
    this.funcArgs = funcArgs
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
        if (dragging.x && dragging.y) {
            dragging.moveRelXY(ev.clientX - dragging.startx, ev.clientY - dragging.starty)
        } else if (dragging.x) {
            dragging.moveRelX(ev.clientX - dragging.startx)
        } else if (dragging.y) {
            dragging.moveRelY(ev.clientY - dragging.starty)
        }
    }
})
document.addEventListener("mouseup", function(ev) {
    if (dragging != null) {
        if (dragging.x && dragging.y) {
            dragging.endDragXY(ev.clientX - dragging.startx, ev.clientY - dragging.starty)
        } else if (dragging.x) {
            dragging.endDragX(ev.clientX - dragging.startx)
        } else if (dragging.y) {
            dragging.endDragY(ev.clientY - dragging.starty)
        }
        dragging = null
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
    var ch = el.childNodes;
    for (var x in ch) {
        try {
            el.removeChild(ch[x])
        } catch (e) {
            //usal thing with some x not being an element
        }
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