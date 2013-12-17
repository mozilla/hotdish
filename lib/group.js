const { data } = require("sdk/self");
const { Class } = require('sdk/core/heritage');
const { EventMethods, cleanForId, bind } = require("utils");
const { URL } = require("sdk/url");
const { Hub } = require("hub");
const { Sidebar } = require("sdk/ui/sidebar");
const windows = require("sdk/windows").browserWindows;
const xulstyle = require("xulstyle");

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
    for (var eventType in this._hubOn) {
      this.hub.on(eventType, this._hubOn[eventType].bind(this));
    }
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

  sendHello: function (helloBack) {
    var msg = {
      name: this.selfIdentity.name,
      color: this.selfIdentity.color
    };
    if (helloBack) {
      msg.type = "hello-back";
    } else {
      msg.type = "hello";
    }
    this.hub.send(msg);
  },

  activate: function () {
    console.log("ACTIVATING");
    this.active = true;
    this.activeWindow = windows.activeWindow;
    this.hub.open();
    xulstyle.style(null && this.activeWindow);
    this.emit("activate");
  },

  deactivate: function () {
    console.log("DEACTIVATING");
    this.hub.close();
    xulstyle.unstyle(this.activeWindow);
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

  _hubOn: {
    message: function (msg) {
      this.emitSidebar("message", msg);
    },
    open: function () {
      this.sendHello(false);
    },
    hello: function () {
      this.sendHello(true);
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
