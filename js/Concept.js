function Concept(node, project) {
    this.node = node
    this.project = project
    this.setName = function(name) {
        this.node.setAttributeNS(this.project.ns, "name", name)
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
}