define(['goo/util/ArrayUtil'],
	/** @lends */
	function (ArrayUtil) {
	'use strict';

	/**
	* @class
	*/
	function Bus() {
		this.trie = { name: '', listeners: [], children: {} };
	}

	/**
	 * Sends messages to all listeners with provided callback function.
	 *
	 * @param {string | string[]} channels channel(s) addressed
	 * @param {Object} data
	 * @param {boolean} [storeEmit=false] Store the emit data for transmitting to future listeners
	 */
	Bus.prototype.emit = function (channels, data, storeEmit) {
		storeEmit = !!storeEmit;

		if (typeof channels === 'string') {
			channels = [channels];
		}

		for (var i = 0; i < channels.length; i++) {
			this._emitToSingle(channels[i], data, storeEmit);
		}

		return this;
	};

	Bus.prototype._getNode = function (channelName, storeEmit) {
		var node = this.trie;
		var channelPath = channelName.split('.');

		for (var i = 0; i < channelPath.length; i++) {
			var channelSub = channelPath[i];

			if (node.children[channelSub]) {
				node = node.children[channelSub];
			} else {
				if (storeEmit) {
					var newNode = { listeners: [], children: [] };
					node.children[channelSub] = newNode;
					node = newNode;
				} else {
					return;
				}
			}
		}

		return node;
	};

	Bus.prototype._emitToSingle = function (channelName, data, storeEmit) {
		var node = this._getNode(channelName, storeEmit);
		if (node) {
			this._emitToAll(node, data);
			if (storeEmit) {
				node.latestData = data;
			}
		}
	};

	Bus.prototype._emitToAll = function (node, data) {
		for (var i = 0; i < node.listeners.length; i++) {
			node.listeners[i](data);
		}

		var childrenKeys = Object.keys(node.children);
		for (var i = 0; i < childrenKeys.length; i++) {
			this._emitToAll(node.children[childrenKeys], data);
		}
	};

	/**
	 * Register callback for a channel
	 * @param {String} channelName
	 * @param {Function} callback function (data)
	 * @param {boolean} [retrieveLatestEmit=false] Retrieve the last emit done before this listener was added (if emitted with storeEmit)
	 */
	Bus.prototype.addListener = function (channelName, callback, retrieveLatestEmit) {
		retrieveLatestEmit = !!retrieveLatestEmit;

		var node = this.trie;
		var channelPath = channelName.split('.');

		for (var i = 0; i < channelPath.length; i++) {
			var channelSub = channelPath[i];

			if (node.children[channelSub]) {
				node = node.children[channelSub];
			} else {
				var newNode = { listeners: [], children: [] };
				node.children[channelSub] = newNode;
				node = newNode;
			}
		}

		if (node.listeners.indexOf(callback) === -1) {
			node.listeners.push(callback);
			if (retrieveLatestEmit && node.latestData) {
				callback(node.latestData);
			}
		}

		return this;
	};

	/**
	 * Remove a listener from a channel but not from its children
	 * @param channelName
	 * @param callbackToRemove
	 */
	Bus.prototype.removeListener = function (channelName, callbackToRemove) {
		var node = this._getNode(channelName);
		if (node) { ArrayUtil.remove(node.listeners, callbackToRemove); }
		return this;
	};

	/**
	 * Removes all listeners on a specific channel
	 * @param channelName
	 */
	Bus.prototype.removeAllOnChannel = function (channelName) {
		var node = this._getNode(channelName);
		if (node) { node.listeners = []; }
		return this;
	};

	/**
	 * Removes a channel and its children
	 * @param channelName
	 */
	Bus.prototype.removeChannelAndChildren = function (channelName) {
		var channelParts = channelName.split('.');

		if (channelParts.length > 1) {
			var leafChannelName = channelParts.pop();
			var parentChannelName = channelParts.join('.');
			var parentNode = this._getNode(parentChannelName);

			delete parentNode.children[leafChannelName];
		} else {
			delete this.trie.children[channelName];
		}

		return this;
	};

	Bus.prototype._removeListener = function (node, callbackToRemove) {
		ArrayUtil.remove(node.listeners, callbackToRemove);

		var childrenKeys = Object.keys(node.children);
		for (var i = 0; i < childrenKeys.length; i++) {
			this._removeListener(node.children[childrenKeys[i]], callbackToRemove);
		}
	};

	/**
	 * Removes a listener from all channels
	 * @param callbackToRemove
	 */
	Bus.prototype.removeListenerFromAllChannels = function (callbackToRemove) {
		this._removeListener(this.trie, callbackToRemove);
		return this;
	};

	Bus.prototype.clear = function () {
		this.trie = { name: '', listeners: [], children: {} };
	};

	return Bus;
});
