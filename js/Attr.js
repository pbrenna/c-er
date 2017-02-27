"use strict";

/*
 * Attr.js
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
        if (this.node.previousElementSibling)
            this.node.parentNode.insertBefore(this.node, this.node.previousElementSibling)
    }
    this.moveDown = function() {
        if (this.node.nextElementSibling && this.node.nextElementSibling.nextElementSibling) {
            this.node.parentNode.insertBefore(this.node, this.node.nextElementSibling.nextElementSibling)
        } else {
            this.node.parentNode.appendChild(this.node)
        }
    }
}
