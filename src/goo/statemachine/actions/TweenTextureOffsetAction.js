define([
	'goo/statemachine/actions/Action',
	'goo/math/Vector2'
],
/** @lends */
	function(
	Action,
	Vector2
	) {
	"use strict";

	function TweenTextureOffsetAction(/*id, settings*/) {
		Action.apply(this, arguments);
	}

	TweenTextureOffsetAction.prototype = Object.create(Action.prototype);
	TweenTextureOffsetAction.prototype.constructor = TweenTextureOffsetAction;

	TweenTextureOffsetAction.external = {
		name: 'Tween Texture Offset',
		description: 'Smoothly changes the texture offset of the entity',
		canTransition: true,
		parameters: [{
			name: 'X Offset',
			key: 'toX',
			type: 'number',
			description: 'X Offset',
			'default': 1
		}, {
			name: 'Y Offset',
			key: 'toY',
			type: 'number',
			description: 'Y Offset',
			'default': 1
		}, {
			name: 'Time',
			key: 'time',
			type: 'number',
			description: 'Time it takes for this transition to complete',
			'default': 1000
		}, {
			name: 'Easing 1',
			key: 'easing1',
			type: 'dropdown',
			description: 'Easing 1',
			'default': 'Linear',
			options: ['Linear', 'Quadratic', 'Exponential', 'Circular', 'Elastic', 'Back', 'Bounce']
		}, {
			name: 'Easing 2',
			key: 'easing2',
			type: 'dropdown',
			description: 'Easing 2',
			'default': 'In',
			options: ['In', 'Out', 'InOut']
		}],
		transitions: [{
			key: 'complete',
			name: 'On Completion',
			description: 'Event fired when the transition completes'
		}]
	};

	TweenTextureOffsetAction.prototype.configure = function(settings) {
		this.toX = settings.toX;
		this.toY = settings.toY;
		this.time = settings.time;
		if (settings.easing1 === 'Linear') {
			this.easing = window.TWEEN.Easing.Linear.None;
		} else {
			this.easing = window.TWEEN.Easing[settings.easing1][settings.easing2];
		}
		this.eventToEmit = { channel: settings.transitions.complete };
	};

	TweenTextureOffsetAction.prototype._setup = function() {
		this.tween = new window.TWEEN.Tween();
	};

	TweenTextureOffsetAction.prototype._run = function(fsm) {
		var entity = fsm.getOwnerEntity();
		if (entity.meshRendererComponent && entity.meshRendererComponent.materials.length > 0) {
			var meshRendererComponent = entity.meshRendererComponent;
			var material = meshRendererComponent.materials[0];
			var texture = material.getTexture('DIFFUSE_MAP');
			var initialOffset = texture.offset;

			var fakeFrom = { x: initialOffset.x, y: initialOffset.y };
			var fakeTo = { x: this.toX, y: this.toY };

			this.tween.from(fakeFrom).to(fakeTo, +this.time).easing(this.easing).onUpdate(function() {
				texture.offset.setd(this.x, this.y);
			}).onComplete(function() {
				fsm.send(this.eventToEmit.channel);
			}.bind(this)).start();
		}
	};

	return TweenTextureOffsetAction;
});