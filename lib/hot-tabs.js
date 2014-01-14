const { data } = require("sdk/self");
const { Class } = require('sdk/core/heritage');
const tabs = require("sdk/tabs");
const windows = require("sdk/windows");
const { EventMethods, assert, bind, setHandlers, decodeQuery, copyMethods } = require("../utils");
const { winIdFromTab, getOuterId } =  require("../tracking-utils");
const { getFavicon } = require("sdk/places/favicon");
const { all, defer } = require('sdk/core/promise');

var viewerScript = data.load("mirror/viewer.js");

var allTabSets = {};

var activated = false;

function activate() {
  if (activated) {
    return;
  }
  activated = true;
  let tabEvents = ["pageshow", "activate", "close", "open"];
  tabEvents.forEach(function (tabEvent) {
    tabs.on(tabEvent, function (sdkTab) {
      var windowId = winIdFromTab(sdkTab);
      var tabSet = allTabSets[windowId];
      if (tabSet) {
        console.log("getting tab for id", windowId, tabSet.windowId, winIdFromTab(sdkTab));
        var tabObj = tabSet.tabForSdkTab(sdkTab);
        tabSet.emit(tabEvent, tabObj);
        if (tabEvent == "close") {
          // Do this after the event is emitted
          tabObj.destroy();
        }
      }
    });
  });
}

exports.TabSet = Class({
  /* Currently a TabSet is equivalent to a window, because that's our
     sharing metaphor.  But otherwise we treat it as basically a group
     of tabs, the window details shouldn't be exposed */

  extends: EventMethods,

  initialize: function (group, domWindow, sdkWindow) {
    activate();
    this.group = group;
    this.windowId = getOuterId(domWindow);
    this.sdkWindow = sdkWindow;
    assert(! allTabSets[this.windowId], "Recreating TabSet with a new window");
    allTabSets[this.windowId] = this;
    this._tabsById = {};
    this.cullMirroredTabs();
    // Load all tabs, and create tab objects for future tabs:
    this.allTabs();
    this.on("open", (function (sdkTab) {
      this.tabForSdkTab(sdkTab);
    }).bind(this));
    this.on("close", (function (sdkTab) {
      this.tabForSdkTab(sdkTab).destroy();
    }).bind(this));
  },

  destroy: function () {
    for (var id in this._tabsById) {
      this._tabsById[id].destroy();
    }
    this.sdkWindow = null;
    delete allTabSets[this.windowId];
  },

  cullMirroredTabs: function () {
    var toDelete = [];
    for each (var tab in this.sdkWindow.tabs) {
      if (tab.url.indexOf(data.url("mirror/blank.html")) != -1) {
        toDelete.push(tab);
      }
    }
    toDelete.forEach(function (t) {
      t.close();
    });
  },

  tabForSdkTab: function (sdkTab) {
    if (this._tabsById[sdkTab.id]) {
      return this._tabsById[sdkTab.id];
    }
    if (winIdFromTab(sdkTab) != this.windowId) {
      console.warn("Tried to get a tab that doesn't match my (" + this.windowId + ") id:", winIdFromTab(sdkTab));
      return null;
    }
    var tab = exports.Tab(this, sdkTab);
    this._tabsById[sdkTab.id] = tab;
    return tab;
  },

  tabForId: function (id) {
    return this._tabsById[id];
  },

  allTabs: function () {
    var result = [];
    for each (var tab in this.sdkWindow.tabs) {
      result.push(this.tabForSdkTab(tab));
    }
    return result;
  },

  allTabsJson: function () {
    return all(this.allTabs().map(function (t) {return t.getJson();}));
  },

  launchViewer: function (tabId) {
    var deferred = defer();
    var url = data.url("mirror.blank.html");
    url += "?tabId=" + encodeURIComponent(tabId);
    tabs.open({
      url: url,
      onOpen: (function (sdkTab) {
        var tab = this.tabForSdkTab(sdkTab);
        tab.viewerTabId = tabId;
        deferred.resolve(tab);
      }).bind(this)
    });
    return deferred.promise;
  },

  activeTab: function () {
    return this.tabFromSdkTab(tabs.activeTab);
  },

  tabWithUrl: function (url) {
    /* Return a tab with the given URL (or null if none found) */
    for each (var tab in this.allTabs()) {
      if (tab.url() == url) {
        return tab;
      }
    }
    return null;
  },

  tabMirroring: function (tabId) {
    /* Returns a tab mirroring the given tabId, or null if none found */
    for each (var tab in this.allTabs()) {
      if (tabId == tab.mirrorTabId()) {
        return tab;
      }
    }
    return null;
  },

  open: function (options) {
    var reactivate;
    if (! this.activeTab()) {
      // Arg, active window isn't ours
      reactivate = windows.activeWindow;
      this.sdkWindow.activate();
    }
    tabs.open(options);
    if (reactivate) {
      reactivate.activate();
    }
  }

});

exports.Tab = Class({

  initialize: function (tabSet, sdkTab) {
    bind(this, "createWorker");
    this.sdkTab = sdkTab;
    this.tabSet = tabSet;
    this.id = this.tabSet.group.clientId + "_" + this.sdkTab.id;
    this.createWorker();
    this.sdkTab.on("pageshow", this.createWorker);
    this.isMirroring = false;
    this.onReloadSendMirror = null;
    copyMethods(this, sdkTab, "pin unpin close reload activate getThumbnail");
  },

  destroy: function () {
    delete this.tabSet._tabsById[this.sdkTab.id];
    this.sdkTab.removeListener("pageshow", this.createWorker);
    this.sdkTab = null;
    this.tabSet = null;
    if (this.worker) {
      this.worker.destroy();
      this.worker = null;
    }
  },

  url: function () {
    return this.sdkTab.url;
  },

  getJson: function (shortForm) {
    if (shortForm) {
      var deferred = defer();
      deferred.resolve({
        id: this.id,
        index: this.sdkTab.index,
        url: this.sdkTab.url
      });
      return deferred.promise;
    }
    var json = {
      id: this.id,
      index: this.sdkTab.index,
      pinned: this.sdkTab.pinned,
      title: this.sdkTab.title,
      url: this.sdkTab.url
    };
    return getFavicon(this.sdkTab).then(function (favicon) {
      json.favicon = favicon;
      return json;
    }, function (error) {
      return json;
    });
  },

  mirrorTabId: function () {
    /* Returns the tab this is mirroring, if it is mirroring a tab;
       returns null otherwise */
    if (this.sdkTab.url.indexOf(data.url("mirror/blank.html")) !== 0) {
      return null;
    }
    var match = /tabId=([^&]*)/.exec(this.sdkTab.url);
    if (! match) {
      console.warn("Mirror tab without tabId:", this.sdkTab.url);
      return null;
    }
    return decodeURIComponent(match[1]);
  },

  startMirroring: function () {
    this.isMirroring = true;
    this.worker.port.emit("mirror");
  },

  createWorker: function () {
    if (this.worker) {
      this.worker.destroy();
      this.worker = null;
    }
    this.worker = this.sdkTab.attach({
      contentScriptFile: [
        data.url("mirror/freeze.js"),
        data.url("pageworker/worker.js")
      ]
    });
    setHandlers(this.worker.port, this.workerOn, this, [this.worker]);
  },

  workerOn: {
    ready: function (worker) {
      if (worker != this.worker) {
        console.warn("Got ready message from stale worker");
        return;
      }
      if ((! this.sdkTab) || ! worker.tab) {
        // We're tearing down right now
        return;
      }
      worker.port.emit("init", {
        clientId: this.tabSet.group.clientId,
        selfIdentity: this.tabSet.group.selfIdentity,
        groupId: this.tabSet.group.groupId,
        togetherJsLocation: require("sdk/simple-prefs").prefs.togtherJsLocation,
        tabId: this.id,
        viewerScript: viewerScript
      });
      if (this.isMirroring) {
        this.startMirroring();
      }
      if (this.onReloadSendMirror) {
        this.worker.port.emit("mirror-doc", this.onReloadSendMirror);
        this.onReloadSendMirror = null;
      }
    },

    emitMirror: function (worker, msg) {
      msg.tabId = this.id;
      msg.type = "mirror-doc";
      msg.url = this.sdkTab.url.replace(/#.*/, "");
      this.tabSet.group.hub.send(msg);
    },

    mirrorReload: function (worker, msg) {
      this.onReloadSendMirror = msg;
      this.reload();
    },

    mirrorFault: function (worker) {
      this.tabSet.group.hub.send({
        type: "mirror-fault",
        tabId: this.mirrorTabId()
      });
    }
  }

});
