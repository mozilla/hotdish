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
        self._sidebarMethods.split(/\s+/g).forEach(function (m) {
          worker.port.on(m, self._sidebarOn[m].bind(self));
        });
      },
      onShow: this.onShowSidebar,
      onHide: this.onHideSidebar
    });
    this.active = false;
    this.activeWindow = null;
  },

  activate: function () {
    console.log("ACTIVATING");
    this.active = true;
    this.activeWindow = windows.activeWindow;
    this.emit("activate");
  },

  deactivate: function () {
    console.log("DEACTIVATING");
    this.active = false;
    this.activeWindow = null;
    this.emit("deactivate");
  },

  _sidebarMethods: "shareTab",

  _sidebarOn: {
    shareTab: function () {
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
