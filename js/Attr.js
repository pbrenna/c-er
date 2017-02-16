"use strict";

function Attr(node, project) {
    this.node = node
    this.project = project
    this.getName = function() {
        return this.node.getAttributeNS(this.project.ns, "name")
    }
    this.setName = function(name) {
        this.node.setAttributeNS(this.project.ns, "name", name)
    }
    this.getIsPrimary = function() {
        return this.node.hasAttributeNS(this.project.ns, "primary") &&
            this.node.getAttributeNS(this.project.ns, "primary") == "true"
    }
    this.setIsPrimary = function(toggle) {
        var newVal = toggle ? "true" : "false"
        this.node.setAttributeNS(this.project.ns, "primary", newVal)
    }
    this.destroy = function() {
        killNode(this.node)
        this.node = null
    }
    this.moveUp = function() {
        if (this.node.previousSibling)
            this.node.parentNode.insertBefore(this.node, this.node.previousSibling)
    }
    this.moveDown = function() {
        if (this.node.nextSibling && this.node.nextSibling.nextSibling) {
            this.node.parentNode.insertBefore(this.node, this.node.nextSibling.nextSibling)
        } else {
            this.node.parentNode.appendChild(this.node)
        }
    }
}