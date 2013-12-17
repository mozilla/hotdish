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

const { getMostRecentBrowserWindow, getXULWindow } = require("sdk/window/utils");
var sss = require("./vendor/stylesheetservice");
let tabstylecss = sss.getURI("xulstyles/hotdish.css");
sss.register(tabstylecss);

exports.style = function (aWindow) {
  aWindow = aWindow || getMostRecentBrowserWindow();
  if (! aWindow.document) {
    aWindow = getXULWindow(aWindow);
  }
  let tabbar = aWindow.document.getElementById('main-window');
  tabbar.classList.add("hotdish");
};

exports.unstyle = function (aWindow) {
  aWindow = aWindow || getMostRecentBrowserWindow();
  if (! aWindow.document) {
    aWindow = getXULWindow(aWindow);
  }
  let tabbar = aWindow.document.getElementById('main-window');
  tabbar.classList.remove("hotdish");
};
