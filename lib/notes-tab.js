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

let notestabForGroup = exports.notestabForGroup = function(groupid){
  if (_notestabs[groupid]) {
    return _notestabs[groupid];
  }
  else {
    console.log("opening:", padurl(groupid));
    tabs.open({
      url: padurl(groupid),
      isPinned: false,
      inBackground: true,
      /* pinned tabs are wonky (live in first window during start.  should be ripped down when sidebar closes.
         Should be true */
      onPageshow: function (tab) { /// never properly events!  GRL
        console.log("page showing!");
      },
      onOpen: function(tab) {
        tab.index=0;
      },
      onReady: function(tab) {
        tab.title = groupid + " Notes";
        console.log("ready!!",groupid, tab.title, tab.url);
        _notestabs[groupid] = tab;
        tab.attach({
          contentScriptFile: [self.data.url('activitylog/etherpad-helper.js')],
          contentScriptWhen: 'end'
        });
      }
    });
  }
};


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
