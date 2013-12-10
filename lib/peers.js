var { Class } = require('sdk/core/heritage');

var Peers = Class({
  initialize: function () {
    this._list = {};
  },

  get: function (clientId) {
    if (! this._list[clientId]) {
      var peer = Peer(clientId);
      this._list[clientId] = peer;
    }
    return this._list[clientId];
  }

});


var Peer = Class({
  initialize: function (clientId) {
    this.clientId = clientId;
    this.name = "Unknown";
    this.avatar = null;
    this.color = "#ff0000";
  },

  update: function (msg) {
    this.name = msg.name || this.name;
    this.avatar = msg.avatar || this.avatar;
    this.color = msg.color || this.color;
  }

});

exports.list = Peers();
