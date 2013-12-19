const { data } = require("sdk/self");
const { Class } = require('sdk/core/heritage');
const { EventMethods, cleanForId, bind } = require("utils");
const { URL } = require("sdk/url");
const { Hub } = require("hub");
const { Sidebar } = require("sdk/ui/sidebar");
const { TabEventer } = require("hot-tabs.js");
const tabs = require("sdk/tabs");
const { getMostRecentBrowserWindow } = require("sdk/window/utils");
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
        self.sidebarWorkerReady = false;
        worker.port.on("ready-init", function () {
          worker.port.emit("init", {
            groupName: self.groupName,
            selfIdentity: self.selfIdentity
          });
        });
        for (var eventName in self._sidebarOn) {
          worker.port.on(eventName, self._sidebarOn[eventName].bind(self));
        }
        worker.port.on("ready", function () {
          console.log("Worker ready");
          self.sidebarWorkerReady = true;
          self._buffer.forEach(function (e) {
            console.log("buffer out", e);
            worker.port.emit.apply(worker.port, e);
          });
          self._buffer = [];
        });
      },
      onShow: this.onShowSidebar,
      onHide: this.onHideSidebar
    });
    this.active = false;
    this.activeSDKWindow = null;
    this.activeDOMWindow = null;
    this.sidebarWorker = null;
    this.sidebarWorkerReady = false;
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
    this.send(msg);
    this.tabEventer.getAllTabs().then((function (tabs) {
      this.send({
        type: "tab-init",
        tabs: tabs
      });
    }).bind(this));
  },

  activate: function () {
    console.log("ACTIVATING", this.hubUrl);
    this.active = true;
    this.activeDOMWindow = getMostRecentBrowserWindow();
    this.activeSDKWindow = windows.activeWindow;
    this.tabEventer = TabEventer(this.activeDOMWindow, this.activeSDKWindow);
    this.hub.open();
    this.tabEventer.on("pageshow", (function (tab) {
      this.send({
        type: "pageshow",
        tab: tab
      });
    }).bind(this));
    xulstyle.style(this.activeDOMWindow);
    this.emit("activate");
  },

  deactivate: function () {
    console.log("DEACTIVATING");
    this.hub.close();
    xulstyle.unstyle(this.activeDOMWindow);
    this.activeDOMWindow = null;
    this.activeSDKWindow = null;
    this.sidebarWorker = null;
    this.sidebarWorkerReady = false;
    this._buffer = [];
    this.active = false;
    this.tabEventer.destroy();
    this.tabEventer = null;
    this.emit("deactivate");
  },

  _sidebarOn: {
    push: function (url) {
      this.send({
        type: "push",
        url: url
      });
    },
    send: function (msg) {
      this.hub.send(msg);
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
    },
    push: function (msg) {
      tabs.open(msg.url);
    }

  },

  emitSidebar: function () {
    if (! this.sidebarWorkerReady) {
      this._buffer.push(Array.prototype.slice.call(arguments));
    } else {
      this.sidebarWorker.port.emit.apply(this.sidebarWorker.port, arguments);
    }
  },

  send: function (msg) {
    this.emitSidebar("internalMessage", msg);
    this.hub.send(msg);
  },

  onShowSidebar: function () {
    if (this.activeDOMWindow && this.activeDOMWindow != getMostRecentBrowserWindow()) {
      // They've shown it on a second window, this will not do!
      var curActive = windows.activeWindow;
      this.sidebar.hide();
      this.activeSDKWindow.activate();
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
