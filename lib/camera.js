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

const self = require("sdk/self");
const { PageMod } = require("sdk/page-mod");
let myprefs = require("sdk/simple-prefs").prefs;


exports.cameraMod = PageMod({
  include: self.data.url("interaction-cam/index.html"),
	contentScriptFile: self.data.url("interaction-cam/pagemod.js"),
  onAttach: function(worker) {
    worker.port.on("set-avatar", function(imgData) {
    	myprefs.avatar = imgData;
    });
  }
});