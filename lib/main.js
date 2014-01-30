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
//require("sdk/preferences/service").set("browser.sessionstore.resume_from_crash", true);

//let { dish } = require("hotdish");
let self = require("sdk/self");
let myprefs = require("sdk/simple-prefs").prefs;
let preferencesservice = require("sdk/preferences/service");
const tabs = require("sdk/tabs");
const { Group } = require("group");
const { groupManager } = require("group-manager");
const { selfIdentity } = require("identity");

require("button");

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

function maybeOpenTab(url, inBackground) {
  for each (var tab in tabs) {
    if (tab.url == url) {
      return;
    }
  }
  tabs.open({
    url: url,
    inBackground: inBackground
  });
}

let main = exports.main = function (options, callback) {
  let reason = options.loadReason;

  let staticargs = options.staticArgs;

  if (reason === "install" || reason === "startup" || reason === "enable") {
    // in the super fanciest world, it would only do this on install, and remember the initial state
    // disable camera permission dialogue --> say 'yes'
    setprefs({"media.navigator.permission.disabled": true});
    setprefs({"security.csp.speccompliant": false});

    if (staticargs.prefs === undefined) {staticargs.prefs = {}; }
    setprefs(staticargs.prefs);
  }

  let groupIds = myprefs.groupId.split(/,/g);
  groupIds = groupIds.map(function (groupId) {
    groupId = groupId.replace(/^\s+/, "").replace(/\s+$/, "");
    if (groupId) {
      groupManager.join(groupId);
    }
    return groupId
  });

  if (staticargs.debug) {
    if (staticargs.staticAvatar) {
      myprefs.avatar = require("debug/mccool").mccool.selfie;
    }
    maybeOpenTab(self.data.url("sidebar/sidebar.html?debug&groupId=" + encodeURIComponent(groupIds[0])));
    groupManager.group(groupIds[0]).sidebar.show();
    maybeOpenTab(self.data.url("interaction-cam/index.html"));
  }

  require("camera");

  if (staticargs.bgTabs !== undefined) {
    var bgTabs = staticargs.bgTabs;
    if (typeof bgTabs == "string") {
      bgTabs = [bgTabs];
    }
    bgTabs.forEach(function (url) {
      maybeOpenTab(url, true);
    });
  }

  if (staticargs.focusTab !== undefined && staticargs.focusTab != -1) {
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

exports.onUnload = function (reason) {
  // note: won't catch unintall, just disable, shutdown, etc.
  console.log("onUnload", reason, Date.now());
  if (reason === "disable" || reason === "uninstall") {
    setprefs({"media.navigator.permission.disabled":false});
    return false
  } else {
    return true;
  }
};
