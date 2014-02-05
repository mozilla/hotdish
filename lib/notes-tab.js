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

let self = require("sdk/self");
let tabs = require("sdk/tabs");

let padurl = function(groupid) "https://etherpad.mozilla.org/"+ groupid +"-session-log";
let iconpath = self.data.url("sidebar/assets/icn-hotdish-orange-crop-20.png");


let _notestabs = {};  // ns?

exports.setupNotesTab = function (group) {
  var groupid = group.groupId;
  if (_notestabs[groupid]) {
    return;
  } else {
    console.log("opening:", padurl(groupid));
    var found = false;
    for each (var tab in tabs) {
      if (tab.url == padurl(groupid)) {
        found = true;
        setupTab(group, tab);
        break;
      }
    }
    if (! found) {
      tabs.open({
        url: padurl(groupid),
        isPinned: false,
        inBackground: true,
        /* pinned tabs are wonky (live in first window during start.  should be ripped down when sidebar closes.
           Should be true */
        onOpen: function (tab) {
          tab.index = 0;
          cullOtherTabs(tab, padurl(groupid));
        },
        onReady: function (tab) {
          cullOtherTabs(tab, padurl(groupid));
          setupTab(group, tab);
        }
      });
    }
  }
};

// FIXME: this is a brutalist way to keep us from having more than one
// etherpad activity log open, we just close any others, hoping that they get
// loaded before the one we "want" (which seems to happen on restart).
function cullOtherTabs(tab, tabUrl) {
  for each (var otherTab in tabs) {
    if (otherTab != tab && otherTab.url == tabUrl) {
      otherTab.close();
    }
  }
}

function setupTab(group, tab) {
  tab.title = group.groupId + " Notes";
  _notestabs[group.groupdId] = tab;
  var worker = tab.attach({
    contentScriptFile: [self.data.url('activitylog/etherpad-helper.js')]
  });
  worker.port.on("ready", function () {
    group.addActivityWorker(worker);
  });
}


let unpinAll = exports.unpinAll = function () {
  for (let k in _notestabs) {
    let t = _notestabs[k];
    console.log("unloading",k,t.title,t.isPinned);
    t.unpin();
    t.close();
  }
}

require("sdk/system/unload").when(function (reason) {
  unpinAll();
});
