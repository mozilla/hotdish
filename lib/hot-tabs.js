/*jshint forin:true, noarg:false, noempty:true, eqeqeq:true, bitwise:true,
  strict:true, undef:true, curly:false, browser:true,
  unused:true,
  indent:2, maxerr:50, devel:true, node:true, boss:true, white:true,
  globalstrict:true, nomen:false, newcap:true, moz: true */

/*global */

"use strict";

const tabs = require("sdk/tabs");
const { winIdFromTab, getOuterId } =  require("./tracking-utils");
const { getFavicon } = require("sdk/places/favicon");
const { EventMethods, assert } = require("utils");
const { Class } = require('sdk/core/heritage');
const { all } = require('sdk/core/promise');

let tabEventers = {
};

exports.TabEventer = Class({
  extends: EventMethods,

  initialize: function (domWindow, sdkWindow) {
    this.windowId = getOuterId(domWindow);
    this.sdkWindow = sdkWindow;
    assert(! tabEventers[this.windowId], "Recreating TabEventer on window");
    tabEventers[this.windowId] = this;
  },

  destroy: function () {
    delete tabEventers[this.windowId];
  },

  getAllTabs: function () {
    var result = [];
    for (var tab of this.sdkWindow.tabs) {
      result.push(describeTab(tab));
    }
    return all(result);
  }

});

let tabEvents = ["pageshow", "activate", "close"];
tabEvents.forEach(function (tabEvent) {
  tabs.on(tabEvent, function (tab) {
    var windowId = winIdFromTab(tab);
    var tracker = tabEventers[windowId];
    if (tracker) {
      describeTab(tab).then(function (described) {
        tracker.emit(tabEvent, described, tab);
      });
    }
  });
});

let describeTab = function (tab) {
  function makeMsg(favicon, tab) {
    return {
      windowid: winIdFromTab(tab),
      // tab properties
      tabid: tab.id,
      index: tab.index,
      pinned: tab.isPinned,
      title: tab.title,
      url: tab.url,
      favicon: favicon
    };
  }
  return getFavicon(tab).then(function (favicon) {
    return makeMsg(favicon, tab);
  }, function (error) {
    return makeMsg(null, tab);
  });
};

let describeTabShort = function (tab) {
  return {
    windowid: winIdFromTab(tab),
    tabid: tab.id,
    index: tab.index,
    url: tab.url
  };
};
