const { data } = require("sdk/self");
const { Class } = require('sdk/core/heritage');
const { EventMethods, cleanForId, bind } = require("utils");
const { URL } = require("sdk/url");
const { Hub } = require("hub");
const { Sidebar } = require("sdk/ui/sidebar");
const windows = require("sdk/windows").browserWindows;

exports.Group = Class({

  extends: EventMethods,

  defaultHubBase: "https://hub.togetherjs.com/hub/",

  initialize: function (groupName, selfIdentity) {
    bind(this, "onShowSidebar onHideSidebar");
    this.clientId = selfIdentity.clientId;
    this.groupName = groupName;
    this.selfIdentity = selfIdentity;
    this.hubUrl = URL(groupName, this.defaultHubBase).toString();
    this.hub = Hub(this.clientId, this.hubUrl);
    this.hub.on("message", function (msg) {
      this.emitSidebar("message", msg);
    });
    var self = this;
    this.sidebar = Sidebar({
      id: cleanForId(this.groupName),
      title: "Hotdish for " + this.groupName,
      url: data.url("sidebar/sidebar.html"),
      onAttach: function (worker) {
        self.sidebarWorker = worker;
        worker.port.on("ready", function () {
          worker.port.emit("init", {
            groupName: self.groupName,
            selfIdentity: self.selfIdentity
          });
        });
        for (var eventName in self._sidebarOn) {
          worker.port.on(eventName, self._sidebarOn[eventName].bind(self));
        }
        self._buffer.forEach(function (e) {
          worker.port.emit.apply(worker.port, e);
        });
        self._buffer = [];
      },
      onShow: this.onShowSidebar,
      onHide: this.onHideSidebar
    });
    this.active = false;
    this.activeWindow = null;
    this.sidebarWorker = null;
    this._buffer = [];
  },

  activate: function () {
    console.log("ACTIVATING");
    this.active = true;
    this.activeWindow = windows.activeWindow;
    this.hub.open();
    this.emit("activate");
  },

  deactivate: function () {
    console.log("DEACTIVATING");
    this.hub.close();
    this.activeWindow = null;
    this.sidebarWorker = null;
    this._buffer = [];
    this.active = false;
    this.emit("deactivate");
  },

  _sidebarOn: {
    shareTab: function () {
    }
  },

  emitSidebar: function () {
    if (! this.sidebarWorker) {
      this._buffer.push(Array.prototype.slice.call(arguments));
    } else {
      this.sidebarWorker.port.emit.apply(this.sidebarWorker.port, arguments);
    }
  },

  onShowSidebar: function () {
    if (this.activeWindow && this.activeWindow != windows.activeWindow) {
      // They've shown it on a second window, this will not do!
      var curActive = windows.activeWindow;
      this.sidebar.hide();
      this.activeWindow.activate();
      this.sidebar.hide();
      curActive.activate();
      this.sidebar.show();
      return;
    }
    this.activate();
  },

  onHideSidebar: function () {
    this.deactivate();
  }

});
