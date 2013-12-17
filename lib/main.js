/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint forin:true, noarg:false, noempty:true, eqeqeq:true, bitwise:true,
  strict:true, undef:true, curly:false, browser:true,
  unused:true,
  indent:2, maxerr:50, devel:true, node:true, boss:true, white:true,
  globalstrict:true, nomen:false, newcap:true, moz: true */

/*global */

require("sdk/preferences/service").set("javascript.options.strict", false);

//let { dish } = require("hotdish");
let self = require("sdk/self");
let myprefs = require("sdk/simple-prefs").prefs;
const { Group } = require("group");
const { selfIdentity } = require("identity");

let groups = [];

let main = exports.main = function (options, callback) {
  const groupIds = myprefs.groupId.split(/,/g);
  groupIds.forEach(function (groupId) {
    groupId = groupId.replace(/^\s+/, "").replace(/\s+$/, "");
    if (! groupId) {
      return;
    }
    groups.push(Group(groupId, selfIdentity));
  });
};
