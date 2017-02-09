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
        for (var x in dragging) {
            var d = dragging[x]
            if (d.dragX && d.dragY) {
                d.moveRelXY(ev.clientX - d.startX, ev.clientY - d.startY)
            } else if (d.dragX) {
                d.moveRelX(ev.clientX - d.startX)
            } else if (d.dragY) {
                d.moveRelY(ev.clientY - d.startY)
            }
        }
    }
})
document.addEventListener("mouseup", function(ev) {
    if (dragging != null) {
        for (var x in dragging) {
            var d = dragging[x]
            if (d.dragX && d.dragY) {
                d.endDragXY(ev.clientX - d.startX, ev.clientY - d.startY)
            } else if (d.dragX) {
                d.endDragX(ev.clientX - d.startX)
            } else if (d.dragY) {
                d.endDragY(ev.clientY - d.startX)
            }
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

function preventBrowserDrag(el) {
    el.addEventListener('dragstart', function(ev) {
        ev.preventDefault()
        return false
    })
}