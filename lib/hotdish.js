/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint forin:true, noarg:false, noempty:true, eqeqeq:true, bitwise:true,
  strict:true, undef:true, curly:false, browser:true,
  unused:true,
  indent:2, maxerr:50, devel:true, node:true, boss:true, white:true,
  globalstrict:true, nomen:false, newcap:true, moz: true */

/*global */

"use strict";

const tabs = require("sdk/tabs");
const windows = require("sdk/windows").browserWindows;
let activeWindow = windows.activeWindow;
const winUtils = require("sdk/deprecated/window-utils");
const {getTabs, getTabId, getOwnerWindow} = require("sdk/tabs/utils");
const {getOuterId,isWindowPrivate,isBrowser,getMostRecentBrowserWindow} = require("sdk/window/utils");
const { hub } = require("hub");
const myprefs = require("simple-prefs").prefs;
const self = require("sdk/self");
const {eventOf, winIdFromTab, emit, Track, browserOnly, chromeWindowForBrowserWindow} =  require("./tracking-utils");
const { basicTabEvents } = require("hot-tabs");
const { setTimeout, clearTimeout } = require("timers");
const { openData } = require("./utils");


// which window is dishing?
let hotdishedwindowid;

let style = exports.style = function (aWindow) { // nsiDomWindow
  // let tabbar = aWindow.document.getElementById('tabbrowser-tabs');
  // tabbar.style['backgroundColor'] = "green";
  // tabbar.style['border'] = "1px solid green";

  // You should be able to adjust the Title here...
  // let titlebar = aWindow.document.getElementById('titlebar-content');
  // titlebar.style['display'] = "none !important";

  let mainWindow = aWindow.document.getElementById('main-window');
  mainWindow.style['border'] = "2px solid green";

};

let unstyle = exports.unstyle = function () {
};


let track = exports.track = function (windowouterid) {
  tabs.on("open",function(tab){
	let me = winIdFromTab(tab);
	console.log("opened",me,tab.id);
  });
  basicTabEvents(windowouterid);  // Todo, unset this on turn off
};

let untrack = exports.untrack = function () {
};


let dish = exports.dish = function() {
  if (hotdishedwindowid !== undefined) {
    // one at a time!
    return;
  }
  let w = getMostRecentBrowserWindow();
  style(w);
  hotdishedwindowid = getOuterId(w);  // yes, global
  track(hotdishedwindowid);
  hub.address = "https://hub.togetherjs.com/hub/" + myprefs.groupId;
  hub.clientId = myprefs.clientId;
  hub.open();
  openData("debug/index.html", {
    groupId: myprefs.groupId,
    clientId: myprefs.clientId
  });
  var noSidebarId = setTimeout(function () {
    console.log("opening");
    openData("socialapi/index.html", {
      groupId: myprefs.groupId,
      clientId: myprefs.clientId
    });
  }, 3000);
  hub.sidebar.on("ready", function () {
    clearTimeout(noSidebarId);
    console.log("got ready");
    sendHello(false);
  });
  track();
};

let undish = exports.undish = function() {
  unstyle();
  untrack();
  hub.close();
};

hub.on("hello", function (msg) {
  sendHello(true);
});

hub.sidebar.on("request-current", function (msg) {
  hub.send({
    type: "request-open",
    url: tabs.activeTab.url
  });
});

hub.sidebar.on("show-edit", function () {
  // FIXME: open actual prefs
  tabs.open("about:addons");
});

hub.on("request-open", function (msg) {
  if (msg.clientId != myprefs.clientId) {
    tabs.open(msg.url);
  }
});

function sendHello(helloBack) {
  var msg = {
    name: myprefs.username,
    color: myprefs.color
  };
  if (helloBack) {
    msg.type = "hello-back";
  } else {
    msg.type = "hello";
  }
  hub.send(msg);
}
