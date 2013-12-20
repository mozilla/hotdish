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

// die if too old
require("newerthan").check("26");


// cfx set this to true.
require("sdk/preferences/service").set("javascript.options.strict", false);

//let { dish } = require("hotdish");
let self = require("sdk/self");
let myprefs = require("sdk/simple-prefs").prefs;
let preferencesservice = require("sdk/preferences/service");
const tabs = require("sdk/tabs");
const { Group } = require("group");
const { selfIdentity } = require("identity");

let setprefs = function (prefs, prefix) {
  if (! prefs) {return; }
  prefix === undefined ? prefix = "+" : true;
  var n = prefix.length;
  Object.keys(prefs).forEach(
      function (k) {
        let v = prefs[k];
        if (k.indexOf(prefix) === 0) { //
          myprefs[k.slice(n)] = v;
        } else {  // regular pref
          preferencesservice.set(k, v);
        }
      }
  );
};



let groups = [];

let main = exports.main = function (options, callback) {
  let reason = options.loadReason;
  console.log("main", reason, Date.now());

  let staticargs = options.staticArgs;

  if (reason === "install" || reason === "startup" || reason === "enable") {
    if (staticargs.prefs === undefined) {staticargs.prefs = {}; }
    setprefs(staticargs.prefs);
  }

  const groupIds = myprefs.groupId.split(/,/g);
  groupIds.forEach(function (groupId) {
    groupId = groupId.replace(/^\s+/, "").replace(/\s+$/, "");
    if (! groupId) {
      return;
    }
    groups.push(Group(groupId, selfIdentity));
  });

  if (staticargs.debug) {
    myprefs.avatar = require("debug/mccool").mccool.selfie;
    tabs.open(self.data.url("sidebar/sidebar.html?debug&groupId=" + encodeURIComponent(groups[0].groupName)));
    groups[0].sidebar.show();
  }

  require("camera");
  tabs.open(self.data.url("interaction-cam/index.html"));

  if (staticargs.bgTabs !== undefined) {
    var bgTabs = staticargs.bgTabs;
    if (typeof bgTabs == "string") {
      bgTabs = [bgTabs];
    }
    bgTabs.forEach(function (url) {
      tabs.open({
        url: url,
        inBackground: true
      });
    });
  }

  if (staticargs.focusTab !== undefined) {
    var index = 0;
    for each (let tab in require("sdk/tabs")) {
      if (staticargs.focusTab == index) {
        tab.activate();
        break;
      }
      index++;
    }
  }

};
