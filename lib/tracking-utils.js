"use strict";

const sysevents = require("sdk/system/events");
const {getTabs, getTabId, getOwnerWindow} = require("sdk/tabs/utils");
const {getOuterId, isWindowPrivate, isBrowser, getXULWindow} = require("sdk/window/utils");
const {extend,merge} = require("sdk/util/object");
const tabs = require("sdk/tabs");
const {WindowTracker} = require("sdk/deprecated/window-utils");
const { Ci } = require("chrome");

let rawTabfromTab = function(tab) {
  if (! tab) {
    throw new Error("Must pass in tab");
  }
  let rawTabs = getTabs();
  for (let rawTab of rawTabs) {
	if (getTabId(rawTab) === tab.id) {
	  return rawTab;
    }
  }
  console.log("no matching tab found", tab.id);
  return null;
};

/**
* @param {tab} jetpack tab object
* @return id of the tab's parent window
*
*/
let winIdFromTab = exports.winIdFromTab = function(tab) {
  var rawTab = rawTabfromTab(tab);
  if (! rawTab) {
    return null;
  }
  var win = getOwnerWindow(rawTab);
  if (! win) {
    console.log("no owner window");
    return null;
  }
  return getOuterId(win);
};

exports.domWindowForSdkTab = function (sdkTab) {
  var rawTab = rawTabfromTab(sdkTab);
  return getOwnerWindow(rawTab);
};

exports.getOuterId = function (win) {
  if (! win instanceof Ci.nsIXULWindow) {
    win = getXULWindow(win);
  }
  return getOuterId(win);
};

let chromeWindowForBrowserWindow = function(){};
try {
  chromeWindowForBrowserWindow = require('sdk/private-browsing/window/utils').getOwnerWindow;
} catch (err) {
  //complete hack to get id of BrowserWindow
  chromeWindowForBrowserWindow = function (window){
	let tabs = window.tabs;
	if (tabs.length === 0) {
      return null;
    }
	return winIdFromTab(tabs[0]);
  };
}

exports.chromeWindowForBrowserWindow = chromeWindowForBrowserWindow;
