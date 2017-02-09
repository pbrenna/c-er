function Relation(concept) {
    this.concept = concept
    this.addParticipation = function(entity, mult_min, mult_max) {
        var part = new Participation(
            this.project.mkErElement("participation", this.concept.node),
            this.concept.project)
        part.setEntity(entity)
        part.setMultMin(mult_min)
        part.setMultMax(mult_max)
    }
    this.destroy = function() {
        this.concept.destroy()
        this.concept = null
    }
}