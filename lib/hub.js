const { Class } = require('sdk/core/heritage');
const { assert, EventMethods } = require("utils");
const channels = require("channels");
const peers = require("peers");

exports.Hub = Class({

  extends: EventMethods,

  initialize: function initialize(clientId, url) {
    this.clientId = clientId;
    this.url = url;
  },

  type: 'hub',

  open: function () {
    assert(this.url, "No address configured");
    assert(this.clientId, "No clientId configured");
    this._worker = channels.WebSocketWorker(this.url);
    this._worker.onmessage = this._onmessage.bind(this);
    this._worker.onopen = (function () {
      this.emit("open");
    }).bind(this);
  },

  close: function () {
    this._worker.close();
    this._worker = null;
    this.emit("close");
  },

  send: function (msg) {
    assert(this._worker, "Called hub.send() while closed");
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
    this.emit("message", msg);
    this.emit(msg.type, msg);
  }

});
