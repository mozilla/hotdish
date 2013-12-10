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

//const {eventOf, winIdFromTab, emit, Track, browserOnly, chromeWindowForBrowserWindow} =  require("./utils");

// which window is dishing?
let hotdishedwindow;

let style = exports.style = function(){
	console.log(activeWindow.title);
	console.log(Object.keys(activeWindow));
	let tabbar = getMostRecentBrowserWindow().document.getElementById('tabbrowser-tabs')
	tabbar.style['backgroundColor'] = "red";
	tabbar.style['border'] = "1px solid green";
}


let dish = exports.dish = function() {
	style();
	track();
}

let undish = exports.undish = function() {
	unstyle();
	untrack();
}






