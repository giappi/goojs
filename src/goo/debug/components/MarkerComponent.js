define([
	'goo/entities/components/Component',
	'goo/shapes/ShapeCreator',
	'goo/debug/BoundingVolumeMeshBuilder'],
/** @lends */
function(
	Component,
	ShapeCreator,
	BoundingVolumeMeshBuilder) {
	"use strict";

	/**
	 * @class Holds the necessary data for a marker
	 * @param {Entity} entity The entity this component is attached to
	 */
	function MarkerComponent(hostEntity) {
		this.type = 'MarkerComponent';

		var hostModelBound = hostEntity.meshRendererComponent.worldBound;
		//this.meshData = ShapeCreator.createBox(hostModelBound.radius * 2, hostModelBound.radius * 2, hostModelBound.radius * 2);
		this.meshData = BoundingVolumeMeshBuilder.build(hostModelBound);
	}

	MarkerComponent.prototype = Object.create(Component.prototype);

	return MarkerComponent;
});