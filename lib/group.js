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
const { merge } = require('sdk/util/object');
const { setupNotesTab } = require("notes-tab");

const { TabSet } = require("hot-tabs");

const NOTIFICATION_ICON = data.url("sidebar/assets/icn-hotdish-orange.png");
function notify(obj) {
  let defaults = {iconURL: NOTIFICATION_ICON};
  return notifications.notify(merge(defaults, obj));
}

var _allGroups = {};

exports.getGroup = function (groupId, selfIdentity) {
  if (_allGroups[groupId]) {
    return _allGroups[groupId];
  }
  if (! selfIdentity) {
    selfIdentity = require("identity").selfIdentity;
  }
  return exports.Group(groupId, selfIdentity);
};

exports.Group = Class({

  extends: EventMethods,

  defaultHubBase: "https://hub.togetherjs.com/hub/",

  initialize: function (groupId, selfIdentity) {
    if (_allGroups[groupId]) {
      throw new Error("You should create the group through getGroup");
    }
    _allGroups[groupId] = this;
    bind(this, "onShowSidebar onHideSidebar");
    this.sidebarCount = 0;
    this.clientId = selfIdentity.clientId;
    this.groupId = groupId;
    this.selfIdentity = selfIdentity;
    this.hubUrl = URL("hotdish_" + groupId, this.defaultHubBase).toString();
    this.hub = Hub(this.clientId, this.hubUrl);
    setHandlers(this.hub, this._hubOn, this);
    this.sidebar = Sidebar({
      id: cleanForId(this.groupId),
      title: "Hotdish:" + this.groupId,
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
    if (! this.sidebarCount) {
      this.sidebar.show();
      return;
    }
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
    this.tabSet.on("titleupdate", (function (tab) {
      this.send({
        type: "titleupdate",
        tab: {
          id: tab.id,
          title: tab.sdkTab.title
        }
      });
    }).bind(this));
    this.tabSet.on("activate", (function (tab) {
      tab.getJson().then((function (json) {
        this.send({
          type: "activate",
          tab: json
        });
      }).bind(this));
      this.sidebar.port.emit("setCurrentTabState", tab.state());
    }).bind(this));
    this.tabSet.on("stateChange", (function (tab) {
      if (tab.isActive()) {
        this.sidebar.port.emit("setCurrentTabState", tab.state());
      }
      this.send({
        type: "stateChange",
        tab: {
          id: tab.id,
          state: tab.state()
        }
      });
    }).bind(this));
    this.tabSet.on("close", (function (tab) {
      tab.getJson(true).then((function (json) {
        this.send({
          type: "close",
          tab: json
        });
      }).bind(this));
    }).bind(this));
    this.tabSet.on("presentingOff", (function (tab) {
      this.send({
        type: "presentingOff",
        tabId: tab.id
      });
    }).bind(this));
    xulstyle.style(this.activeDOMWindow);
    this.emit("activate");
    setupNotesTab(this);
  },

  addActivityWorker: function (worker) {
    this.activityWorker = worker;
  },

  deactivate: function () {
    if (this.sidebarCount) {
      this.sidebar.hide();
    }
    console.log("DEACTIVATING", this.groupId);
    this.tabSet.destroy();
    this.tabSet = null;
    this.hub.close();
    if (this.activateDOMWindow === getMostRecentBrowserWindow()) {
      xulstyle.unstyle(this.activeDOMWindow);
    }
    this.activeDOMWindow = null;
    this.activeSDKWindow = null;
    this.active = false;
    this.emit("deactivate");
  },

  _sidebarOn: {
    sendInvitations: function (names) {
      var text = "";
      for (var i=0; i<names.length-1; i++) {
        if (text) {
          text += ", ";
        }
        text += names[i];
      }
      if (names.length > 1) {
        text += " and " + names[names.length-1];
        text += " were";
      } else {
        text += names[0] + " was";
      }
      notify({
        title: "hotdish",
        text: text + " invited"
      });
      this.sidebar.port.emit("invited", names);
      this.send({
        type: "invited",
        invitees: names
      });
    },
    notifyInvitesSent: function () {
      notify({
        title: "hotdish",
        text: "Invites sent!"
      });
    },
    notifyEveryoneHere: function () {
      notify({
        title: "hotdish",
        text: "Yay, everyone is here!"
      });
    },
    push: function (peerId) {
      var tab = this.tabSet.activeTab();
      if (! tab) {
        return;
      }
      this.send({
        type: "push",
        url: tab.url(),
        title: tab.sdkTab.title,
        forPeer: peerId
      });
    },
    pushPresenting: function (peerId) {
      var tab = this.tabSet.activeTab();
      if (! tab) {
        return;
      }
      this.send({
        type: "pushPresenting",
        tabId: tab.id,
        url: tab.url(),
        title: tab.sdkTab.title,
        forPeer: peerId
      });
    },
    setPresenting: function (presenting) {
      var tab = this.tabSet.activeTab();
      if (! tab) {
        return;
      }
      if (presenting) {
        tab.makePresenting();
      } else {
        if (tab.state() == "presenting") {
          tab.disablePresenting();
        }
        tab.makeLive();
      }
    },
    closeViewing: function () {
      var tab = this.tabSet.activeTab();
      if (tab.state() != "viewing") {
        console.warn("Tried to closeViewing on a tab that is", tab.state());
        return;
      }
      tab.disableViewing();
    },
    send: function (msg) {
      this.send(msg);
    },
    chat: function (text) {
      if (text.indexOf("/") === 0) {
        var cmdName = (/^\/([a-z0-9]+)/i).exec(text);
        if (cmdName) {
          cmdName = cmdName[1];
          var cmd = this.commands[cmdName];
          if (cmd) {
            cmd.call(this, text);
            return;
          }
        }
      }
      this.send({
        type: "chat",
        text: text
      });
      this.notifyChat(this.selfIdentity, text);
    },
    spectate: function (tabId) {
      this.tabSet.launchViewer(tabId).then((function (tab) {
        this.send({
          type: "spectate",
          tabId: tabId
        });
      }).bind(this));
    },
    visitPage: function (url) {
      this.tabSet.visitPage(url);
    },
    allUsersHere: function () {
      notify({
        title: "Everyone is here!",
        text: "Everyone you invited has arrived"
      });
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
      peer.tabs = {};
      // FIXME: these seem unnecessary:
      //this.notifyNewPeer(peer);
      //this.sidebar.port.emit("peer", peer, true);
    },
    hubMissedPeer: function () {
      // Happens when we get a peer that hasn't introduced itself before
      this.sendHello(false);
    },
    pageshow: function (msg) {
      msg.peer.tabs[msg.tab.id] = msg.tab.url;
      this.tabSet.activateLiveForUrl(msg.tab.url);
    },
    "tab-init": function (msg) {
      msg.tabs.forEach(function (tab) {
        msg.peer.tabs[tab.id] = tab.url;
        this.tabSet.activateLiveForUrl(tab.url);
      }, this);
    },
    close: function (msg) {
      delete msg.peer.tabs[msg.tab.id];
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
      if (msg.forPeer && msg.forPeer != this.clientId) {
        // For someone else
        return;
      }
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
        notify({
          title: msg.peer.name + " shared a tab",
          text: msg.title + " (" + msg.url + ")",
          onClick: function () {
            tab.hardActivate();
          }
        });
      }).bind(this));
    },
    pushPresenting: function (msg) {
      if (msg.forPeer && msg.forPeer != this.clientId) {
        // For someone else
        return;
      }
      var url = msg.url.replace(/#.*/, "");
      var tab = this.tabSet.tabMirroring(msg.tabId);
      if (tab) {
        // FIXME: should we do anything at all?
        return;
      }
      tab = this.tabSet.tabWithUrl(url);
      function pushNotify(tab) {
        notify({
          title: msg.peer.name + " is presenting",
          text: msg.title + " (" + msg.url + ")",
          onClick: function () {
            tab.hardActivate();
          }
        });
      }
      if (tab) {
        tab.replaceAsViewer(msg.tabId);
        pushNotify(tab);
      } else {
        this.tabSet.launchViewer(msg.tabId).then(function (tab) {
          pushNotify(tab);
        });
      }
    },
    presentingOff: function (msg) {
      var tab = this.tabSet.tabMirroring(msg.tabId);
      if (tab) {
        if (tab.onReloadSendMirror) {
          tab.onReloadSendMirror.push(["presentingOff"]);
        } else {
          tab.worker.port.emit("presentingOff");
        }
      }
      // FIXME: should notify user somehow
    },
    spectate: function (msg) {
      var tab = this.tabSet.tabForId(msg.tabId);
      if (! tab) {
        // Someone else's tab
        return;
      }
      tab.makePresenting();
      notify({
        title: "Live sharing",
        text: "You are sharing " + tab.url(),
        onClick: (function () {
          tab.hardActivate();
        }).bind(this)
      });
      this.sidebar.port.emit("joinedMirror", msg, tab.id);
    },
    "mirror-doc": function (msg) {
      var tab = this.tabSet.tabMirroring(msg.tabId);
      if (tab) {
        // FIXME: should I be touching .worker?
        if (tab.onReloadSendMirror) {
          // Definitely not in this way...
          tab.onReloadSendMirror.push(["mirror-doc", msg]);
        } else {
          tab.worker.port.emit("mirror-doc", msg);
          tab._checkTitle();
        }
      }
    },
    "mirror-fault": function (msg) {
      var tab = this.tabSet.tabForId(msg.tabId);
      if (tab) {
        tab.worker.port.emit("mirror-fault");
      }
    }
  },

  commands: {
    debug: function () {
      this.tabSet.visitPage(data.url("sidebar/sidebar.html?debug&groupId=" + encodeURIComponent(this.groupId)));
    }
  },

  notifyChat: function (peer, text) {
    if (peer.clientId == this.clientId) {
      // notify({
      //   title: "You said:",
      //   text: text
      // });
    } else {
      notify({
        title: peer.name + "@hotdish:",
        text: text
      });
    }
  },

  notifyNewPeer: function (peer) {
    notify({
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
    if (this.activityWorker) {
      this.activityWorker.port.emit("internalMessage", msg);
    }
  },

  onShowSidebar: function () {
    this.sidebarCount += 1;
    if (this.sidebarCount > 1) {
      // They've shown it on a second window, this will not do!
      this.sidebar.hide();
      return;
    } else {
      this.activate();
    }
  },

  onHideSidebar: function () {
    this.sidebarCount -= 1;
    this.deactivate();
  }


});
