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

	function MultiplyVariableAction(settings) {
		Action.apply(this, arguments);
	}

	MultiplyVariableAction.prototype = Object.create(Action.prototype);

	MultiplyVariableAction.prototype.configure = function(settings) {
		this.everyFrame = !!settings.everyFrame;
		this.variable = settings.variable || null;
		this.amount = settings.amount || 1;
	};

	MultiplyVariableAction.external = {
		parameters: [{
			name: 'Variable',
			key: 'variable',
			type: 'identifier'
		}, {
			name: 'Amount',
			key: 'amount',
			type: 'float'
		}, {
			name: 'On every frame',
			key: 'everyFrame',
			type: 'boolean',
			description: 'Do this action every frame',
			'default': false
		}],
		transitions: []
	};

	MultiplyVariableAction.prototype._run = function(fsm) {
		fsm.applyToVariable(this.variable, function(v) {
			return v * FSMUtil.getValue(this.amount, fsm);
		}.bind(this));
	};

	return MultiplyVariableAction;
});