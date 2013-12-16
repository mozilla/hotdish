const { Class } = require('sdk/core/heritage');
const { EventTarget } = require("sdk/event/target");
const { assert } = require("utils");
const channels = require("channels");
const peers = require("peers");
var { on, once, off, emit } = require('sdk/event/core');

var Hub = Class({

  extends: EventTarget,

  initialize: function initialize() {
    this.address = null;
    this.clientId = null;
    this.sidebar = Sidebar(this);
  },

  type: 'hub',

  open: function () {
    assert(this.address, "No address configured");
    assert(this.clientId, "No clientId configured");
    this._worker = channels.WebSocketWorker(this.address);
    this._worker.onmessage = this._onmessage.bind(this);
    emit(this, "open");
  },

  close: function () {
    this._worker.close();
    this._worker = null;
    emit(this, "close");
  },

  on: function (type, handler) {
    return on(this, type, handler);
  },

  off: function (type, handler) {
    return off(this, type, handler);
  },

  send: function (msg) {
    msg.clientId = this.clientId;
    this._worker.send(msg);
    console.log("->", JSON.stringify(msg, null, 2));
  },

  sendSidebar: function (msg) {
    msg.addon = this.clientId;
    this._worker.send(msg);
    console.log("sidebar>", JSON.stringify(msg, null, 2));
  },

  _onmessage: function (msg) {
    if (msg.type == "init-connection") {
      return;
    }
    if (msg.sidebar) {
      if (msg.sidebar == this.clientId) {
        console.log("<sidebar", JSON.stringify(msg, null, 2));
        emit(this.sidebar, msg.type, msg);
      }
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
    emit(this, msg.type, msg);
  }

});

var Sidebar = Class({

  extends: EventTarget,

  initialize: function initialize(hub) {
    this.hub = hub;
  },

  send: function (msg) {
    this.hub.sendSidebar(msg);
  },

  on: function (type, handler) {
    return on(this, type, handler);
  },

  off: function (type, handler) {
    return off(this, type, handler);
  }

});


exports.hub = Hub();
exports.sidebar = exports.hub.sidebar;
