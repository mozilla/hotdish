const { Class } = require('sdk/core/heritage');
const { EventTarget } = require("sdk/event/target");
const { assert } = require("utils");
const channels = require("channels");
const peers = require("peers");

var Hub = Class({

  extends: EventTarget,

  initialize: function initialize() {
    this.address = null;
    this.clientId = null;
  },

  type: 'hub',

  open: function () {
    assert(this.address, "No address configured");
    assert(this.clientId, "No clientId configured");
    this._worker = channels.WebSocketWorker(this.address);
    this._worker.onmessage = this._onmessage;
  },

  close: function () {
    this._worker.close();
    this._worker = null;
  },

  send: function (msg) {
    msg.clientId = this.clientId;
    this._worker.send(msg);
    console.log("->", JSON.stringify(msg, null, 2));
  },

  _onmessage: function (msg) {
    if (msg.type == "init-connection") {
      return;
    }
    if (! msg.clientId) {
      console.warn("Got message without clientId:", msg);
      return;
    }
    console.log("<-", JSON.stringify(msg, null, 2));
    var peer = peers.list.get(msg.clientId);
    if (msg.type == "hello") {
      peer.update(msg);
    }
    msg.peer = peer;
    this.emit(msg.type, msg);
  }

});

exports.hub = Hub();
