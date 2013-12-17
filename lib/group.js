const self = require("sdk/self");
const { Class } = require('sdk/core/heritage');
const { EventMethods, cleanForId, bind } = require("utils");
const { URL } = require("sdk/url");
const { Hub } = require("hub");
const { Sidebar } = require("sdk/ui/sidebar");
const windows = require("sdk/windows");

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
    var this_ = this;
    this.sidebar = Sidebar({
      id: cleanForId(this.groupName),
      title: "Hotdish for " + this.groupName,
      url: self.data.url("sidebar/sidebar.html"),
      onAttach: function (worker) {
        this_.sidebarWorker = worker;
        worker.port.on("ready", function () {
          worker.port.emit("init", {
            groupName: this_.groupName,
            selfIdentity: this_.selfIdentity
          });
        });
        this_._sidebarMethods.split(/\s+/g).forEach(function (m) {
          worker.port.on(m, this_.sidebarOn[m].bind(this_));
        });
      },
      onShow: this.onShowSidebar,
      onHide: this.onHideSidebar
    });
    this.active = false;
    this.activeWindow = null;
  },

  _sidebarMethods: "shareTab",

  _sidebarOn: {
    shareTab: function () {
    }
  },

  onShowSidebar: function () {
    this.active = true;
    this.activeWindow = windows.activeWindow;
    this.emit("activate");
  },

  onHideSidebar: function () {
    this.active = false;
    this.activeWindow = null;
    this.emit("deactivate");
  }

});
