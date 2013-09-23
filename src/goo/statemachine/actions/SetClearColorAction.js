define([
	'goo/statemachine/actions/Action',
	'goo/statemachine/FSMUtil'
],
/** @lends */
function(
	Action,
	FSMUtil
	) {
	"use strict";

	function SetClearColorAction(settings) {
		Action.apply(this, arguments);
	}

	SetClearColorAction.prototype = Object.create(Action.prototype);

	SetClearColorAction.prototype.configure = function(settings) {
		this.everyFrame = settings.everyFrame !== false;
		this.color = settings.color || [0, 0.05, 0.1, 1];
	};

	SetClearColorAction.external = {
		parameters: [{
			name: 'Color',
			key: 'color',
			type: 'color'
		}, {
			name: 'On every frame',
			key: 'everyFrame',
			type: 'boolean',
			description: 'Do this action every frame',
			'default': false
		}],
		transitions: []
	};

	SetClearColorAction.prototype.onCreate = function(fsm) {
		console.log("Setting clear color to " + JSON.stringify(this.color));
		fsm.getEngine().renderer.setClearColor(
			FSMUtil.getValue(this.this.color[0], fsm),
			FSMUtil.getValue(this.this.color[1], fsm),
			FSMUtil.getValue(this.this.color[2], fsm),
			FSMUtil.getValue(this.this.color[3], fsm)
		);
	};

	return SetClearColorAction;
});