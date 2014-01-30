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

const { Class } = require('sdk/core/heritage');
const windows = require("sdk/windows").browserWindows;


const { EventMethods, cleanForId, bind, setHandlers } = require("utils");

let { Group } = require("group");
const { selfIdentity } = require("identity");


let GroupManager = Class({

  extends: EventMethods,

  initialize: function (groupId, selfIdentity) {
    //bind(this, "onShowSidebar onHideSidebar");
    this._groups = {};  // namespace?
  },

  join: function (groupId) {
    console.log("joining?",groupId);
    let g = this._groups[groupId];
    if (g === undefined) {
      g = Group(groupId, selfIdentity);
      this._groups[groupId] = g;
    }
    return g;
  },

  leave:  function (groupId) {
    delete this._groups[groupId];
  },

  onTryJoinGroup: function (groupId) {
  },

  onLeaveGroup:  function (groupId) {
  },

  group: function (groupId) this._groups[groupId],

  // yeah, this is janky.
  ofActiveWindow:  function () {
    for (let k in this._groups) {
       if (this._groups[k].activeSDKWindow === windows.activeWindow) {
        return k
       }
    }
    return undefined
  }

});

exports.groupManager = GroupManager();
