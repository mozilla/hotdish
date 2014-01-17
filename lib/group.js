const { data } = require("sdk/self");
const { Class } = require('sdk/core/heritage');
const { EventMethods, cleanForId, bind, setHandlers } = require("utils");
const { URL } = require("sdk/url");
const { Hub } = require("hub");
const { Sidebar } = require("fancysidebar");
const { getMostRecentBrowserWindow } = require("sdk/window/utils");
const windows = require("sdk/windows").browserWindows;
const xulstyle = require("xulstyle");
const ss = require("sdk/simple-storage");
const notifications = require("sdk/notifications");
const { TabSet } = require("hot-tabs");

exports.Group = Class({

  extends: EventMethods,

  defaultHubBase: "https://hub.togetherjs.com/hub/",

  initialize: function (groupId, selfIdentity) {
    bind(this, "onShowSidebar onHideSidebar");
    this.clientId = selfIdentity.clientId;
    this.groupId = groupId;
    this.selfIdentity = selfIdentity;
    this.hubUrl = URL("hotdish_" + groupId, this.defaultHubBase).toString();
    this.hub = Hub(this.clientId, this.hubUrl);
    setHandlers(this.hub, this._hubOn, this);
    this.sidebar = Sidebar({
      id: cleanForId(this.groupId),
      title: "Share with " + this.groupId,
      url: data.url("sidebar/sidebar.html"),
      onShow: this.onShowSidebar,
      onHide: this.onHideSidebar,
      initData: {
        selfIdentity: selfIdentity,
        groupId: groupId
      }
    });
    setHandlers(this.sidebar.port, this._sidebarOn, this);
    this.active = false;
    this.activeSDKWindow = null;
    this.activeDOMWindow = null;
    this.tabSet = null;
    this.selfIdentity.on("update", (function(){
      this.sidebar.port.emit("init", {
        selfIdentity: this.selfIdentity,
        groupId: this.groupId
      });
      this.sendHello(true);
    }).bind(this));
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
    this.tabSet.allTabsJson().then((function (tabsJson) {
      this.send({
        type: "tab-init",
        tabs: tabsJson
      });
    }).bind(this));
  },

  activate: function () {
    console.log("Activating Hotdish with hub:", this.hubUrl);
    console.log("-------------------------------------------------------");
    this.active = true;
    this.activeDOMWindow = getMostRecentBrowserWindow();
    this.activeSDKWindow = windows.activeWindow;
    this.tabSet = TabSet(this, this.activeDOMWindow, this.activeSDKWindow);
    this.hub.open();
    this.tabSet.on("pageshow", (function (tab) {
      tab.getJson().then((function (json) {
        this.send({
          type: "pageshow",
          tab: json
        });
      }).bind(this));
    }).bind(this));
    this.tabSet.on("activate", (function (tab) {
      tab.getJson().then((function (json) {
        this.send({
          type: "activate",
          tab: json
        });
      }).bind(this));
    }).bind(this));
    this.tabSet.on("close", (function (tab) {
      tab.getJson(true).then((function (json) {
        this.send({
          type: "close",
          tab: json
        });
      }).bind(this));
    }).bind(this));
    xulstyle.style(this.activeDOMWindow);
    this.emit("activate");
  },

  deactivate: function () {
    console.log("DEACTIVATING");
    this.tabSet.destroy();
    this.tabSet = null;
    this.hub.close();
    xulstyle.unstyle(this.activeDOMWindow);
    this.activeDOMWindow = null;
    this.activeSDKWindow = null;
    this.active = false;
    this.emit("deactivate");
  },

  _sidebarOn: {
    push: function (url) {
      var tab = this.tabSet.activeTab();
      if (! tab) {
        return;
      }
      this.send({
        type: "push",
        url: tab.url()
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
    },
    joinMirror: function (tabId) {
      this.tabSet.launchViewer(tabId).then((function (tab) {
        this.send({
          type: "joinedMirror",
          tabId: tabId
        });
      }).bind(this));
    }
  },

  _hubOn: {
    hubMessage: function (msg) {
      this.sidebar.port.emit("message", msg);
    },
    hubOpen: function () {
      this.sendHello(false);
    },
    hubNewPeer: function (peer) {
      this.notifyNewPeer(peer);
      this.sidebar.port.emit("peer", peer, true);
    },
    hello: function (msg) {
      this.sendHello(true);
      this.trackUser(msg);
      this.sidebar.port.emit("peer", msg, true);
    },
    "hello-back": function (msg) {
      this.trackUser(msg);
      this.sidebar.port.emit("peer", msg);
    },
    chat: function (msg) {
      this.notifyChat(msg.peer, msg.text);
      this.sidebar.port.emit("chat", msg);
    },
    push: function (msg) {
      var tab = this.tabSet.tabWithUrl(msg.url);
      if (tab) {
        tab.reload();
        this.sidebar.port.emit("push", msg, tab.id, true);
        return;
      }
      this.tabSet.open({
        url: msg.url,
        inBackground: true
      }).then((function (tab) {
        this.sidebar.port.emit("push", msg, tab.id, false);
      }).bind(this));
    },

    joinedMirror: function (msg) {
      var tab = this.tabSet.tabForId(msg.tabId);
      if (! tab) {
        // Someone else's tab
        return;
      }
      tab.startMirroring();
      notifications.notify({
        title: "Live sharing",
        text: "You are sharing " + tab.url(),
        onClick: (function () {
          // FIXME: this doesn't actually seem to work if this
          // instance of Firefox is not in the foreground
          this.activeSDKWindow.activate();
          tab.activate();
        }).bind(this)
      });
      this.sidebar.port.emit("joinedMirror", msg, tab.id);
    },
    "mirror-doc": function (msg) {
      var tab = this.tabSet.tabMirroring(msg.tabId);
      if (tab) {
        // FIXME: should I be touching .worker?
        tab.worker.port.emit("mirror-doc", msg);
      }
    },
    "mirror-fault": function (msg) {
      var tab = this.tabSet.tabMirroring(msg.tabId);
      if (tab) {
        tab.worker.port.emit("mirror-fault");
      }
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

  send: function (msg) {
    this.sidebar.port.emit("internalMessage", msg);
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
