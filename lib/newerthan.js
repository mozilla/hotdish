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

const { version:fxVersion, versionInRange } = require("sdk/system/xul-app");
const self = require("sdk/self");
const tabs = require("sdk/tabs");

exports.check=function(minVersion) {
  console.log(fxVersion);
  if (!versionInRange(fxVersion, minVersion, '1000')){
    tabs.open(self.data.url("old-firefox.html"))
    require("sdk/addon/installer").uninstall(self.id);
    throw new Error("firefox is too old.");
  }
}
