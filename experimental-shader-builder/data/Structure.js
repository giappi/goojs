(function () {
	'use strict';

	function Structure() {
		this.nodes = {};
	}

	Structure.prototype.addNode = function (node) {
		this.nodes[node.id] = node;
		return this;
	};

	Structure.prototype.removeNode = function (node) {
		// remove connections to the node
		delete this.nodes[node.id];
		return this;
	};

	// why proxy these opertations?
	// because they'll verify the validity of the graph
	// the node alone cannot do that
	Structure.prototype.addConnection = function (node, connection) {
		// verify connection validity
		var fromNode = this.nodes[from];
		fromNode.addConnection(connection);
		return this;
	};

	Structure.prototype.removeConnection = function (node, connection) {
		var fromNode = this.nodes[from];
		fromNode.removeConnection(connection);
		return this;
	};

	Structure.prototype.toJSON = function () {
		return _(this.nodes).map(function (node) {
			return node.toJSON();
		});
	};

	Structure.fromJSON = function (json) {
		var structure = new Structure();
		_(json).forEach(function (nodeConfig) {
			var node = (nodeConfig.type === 'external' ? ExternalNode : FunctionNode).fromJSON(nodeConfig);
			structure.addNode(node);
		});
		return structure;
	};
})();