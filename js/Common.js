function ERObject(node, project) {
    this.node = node
    this.project = project
    this.getG = function() {
        return this.project.svg.getElementById('svg-' + this.getId())
    }
    this.getId = function() {
        return this.node.getAttribute("id")
    }
}