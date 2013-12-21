const { data } = require("sdk/self");
const { Class } = require('sdk/core/heritage');
const { EventMethods, cleanForId, bind, setHandlers } = require("utils");
const { URL } = require("sdk/url");
const { Hub } = require("hub");
const { Sidebar } = require("sdk/ui/sidebar");
const { TabEventer } = require("hot-tabs.js");
const tabs = require("sdk/tabs");
const { getMostRecentBrowserWindow } = require("sdk/window/utils");
const windows = require("sdk/windows").browserWindows;
const xulstyle = require("xulstyle");
const ss = require("sdk/simple-storage");
const notifications = require("sdk/notifications");

exports.Group = Class({

  extends: EventMethods,

  defaultHubBase: "https://hub.togetherjs.com/hub/",

  initialize: function (groupName, selfIdentity) {
    bind(this, "onShowSidebar onHideSidebar");
    this.clientId = selfIdentity.clientId;
    this.groupName = groupName;
    this.selfIdentity = selfIdentity;
    this.hubUrl = URL("hotdish_" + groupName, this.defaultHubBase).toString();
    this.hub = Hub(this.clientId, this.hubUrl);
    setHandlers(this.hub, this._hubOn, this);
    var self = this;
    this.sidebar = Sidebar({
      id: cleanForId(this.groupName),
      title: "Share with " + this.groupName,
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
        setHandlers(worker, self._sidebarOn, self);
        worker.port.on("ready", function () {
          self.sidebarWorkerReady = true;
          self._buffer.forEach(function (e) {
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
    this._workers = {};
    this.selfIdentity.on("update",function(){
      self.sidebarWorker.port.emit("init", {
        groupName: self.groupName,
        selfIdentity: self.selfIdentity
      });
      self.sendHello(true);
    });
  },

  sendHello: function (helloBack) {
    var msg = {
      name: this.selfIdentity.name,
      color: this.selfIdentity.color,
      avatar: this.selfIdentity.avatar
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
    this.tabEventer.on("pageshow", (function (tab, sdkTab) {
      this.send({
        type: "pageshow",
        tab: tab
      });
      this.createTabWorker(sdkTab);
    }).bind(this));
    this.tabEventer.on("close", (function (tab) {
      var worker = this._workers[tab.id];
      if (worker) {
        worker.destroy();
        delete this._workers[tab.id];
      }
    }).bind(this));
    this.tabEventer.on("activate", (function (tab) {
      this.send({
        type: "activate",
        tab: tab
      });
    }).bind(this));
    xulstyle.style(this.activeDOMWindow);
    this.emit("activate");
    for each (var tab in this.activeSDKWindow.tabs) {
      this.createTabWorker(tab);
    }
  },

  createTabWorker: function (tab) {
    var worker = tab.attach({
      contentScriptFile: [
        data.url("pageworker/worker.js")
      ]
    });
    if (this._workers[tab.id]) {
      this._workers[tab.id].destroy();
    }
    this._workers[tab.id] = worker;
    setHandlers(worker, this._workerOn, this, [worker]);
  },

  deactivate: function () {
    console.log("DEACTIVATING");
    for (var tabid in this._workers) {
      this._workers[tabid].destroy();
    }
    this._workers = {};
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
        url: tabs.activeTab.url
      });
    },
    send: function (msg) {
      this.send(msg);
    },
    chat: function (text) {
      this.send({
        type: "chat",
        text: text
      });
      this.notifyChat(this.selfIdentity, text);
    }
  },

  _hubOn: {
    message: function (msg) {
      this.emitSidebar("message", msg);
    },
    open: function () {
      this.sendHello(false);
    },
    hello: function (msg) {
      this.sendHello(true);
      this.trackUser(msg);
    },
    "hello-back": function (msg) {
      this.trackUser(msg);
    },
    push: function (msg) {
      for each (var tab in this.activeSDKWindow.tabs) {
        if (tab.url == msg.url) {
          tab.reload();
          return;
        }
      }
      tabs.open({
        url: msg.url,
        inBackground: true
      });
    },
    chat: function (msg) {
      this.notifyChat(msg.peer, msg.text);
    },
    newPeer: function (peer) {
      this.notifyNewPeer(peer);
    }
  },

  notifyChat: function (peer, text) {
    if (peer.clientId == this.clientId) {
      notifications.notify({
        title: "You said:",
        text: text
      });
    } else {
      notifications.notify({
        title: peer.name + "@hotdish:",
        text: text
      });
    }
  },

  notifyNewPeer: function (peer) {
    notifications.notify({
      title: "hotdish",
      text: peer.name + " joined the potluck!"
    });
  },

  _workerOn: {
    hash: function (worker, hash) {
      // FIXME: this never seems to happen
      console.log("hash:", worker.tab.url, hash);
    },
    ready: function (worker) {
      // FIXME: This would be a good place to update the hash, apparently
      try {
        worker.port.emit("init", {
          clientId: this.clientId,
          selfIdentity: this.selfIdentity,
          groupId: this.groupName
        });
      } catch (e) {
        console.log("Could not communicate with worker:", worker.tab.url);
      }
    }
  },

  trackUser: function (msg) {
    if (! ss.storage.seenUsers) {
      ss.storage.seenUsers = [];
    }
    ss.storage.seenUsers.push({
      date: Date.now(),
      clientId: msg.clientId,
      name: msg.name
    });
    // Trigger write:
    ss.storage.seenUsers = ss.storage.seenUsers;
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
