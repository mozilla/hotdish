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

let { Hotkey} = require("sdk/hotkeys");
let configureuser = require("configure-user");
let { dish } = require("hotdish");
let self = require("self");

var showHotKey = Hotkey({
  combo: "accel-shift-s",
  onPress: function () {
    dish();
  }
});


let windowShoer = function() {
	var windows = require("sdk/windows");
	for each (var window in windows.browserWindows) {
	  console.log(window.title);
	}
};


var windowShoer2 = Hotkey({
  combo: "accel-shift-a",
  onPress: function () {
    showAllWindows();
  }
});


let main = exports.main = function (options, callback) {
  configureuser.configure();
  dish();
};
