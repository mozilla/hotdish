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

const myprefs = require("sdk/simple-prefs").prefs;
const self = require("sdk/self");
const { PageMod } = require("sdk/page-mod");
const { groupMemory } = require("group-memory");
var windows = require("sdk/windows").browserWindows;
const inviteWatcher = require("invite-watcher");

exports.cameraMod = PageMod({

  include: self.data.url("interaction-cam/index.html"),

  contentScriptFile: self.data.url("interaction-cam/pagemod.js"),

  onAttach: function (worker) {
    var { Group, getGroup } = require("group");
    worker.port.on("set-avatar", function (imgData) {
      myprefs.avatar = imgData;
    });
    worker.port.on("set-name", function (name) {
      myprefs.username = name;
    });
    function emitGroupData() {
      worker.port.emit("set-name", myprefs.username);
      var group = Group.forSdkTab(worker.tab);
      if (group) {
        worker.port.emit("thisGroup", {
          groupId: group.groupId,
          name: group.name,
          active: true,
          inviteLink: inviteWatcher.INVITE_BASE + encodeURIComponent(group.groupId)
        });
      } else {
        worker.port.emit("thisGroup", null);
      }
      worker.port.emit("groupList", groupMemory.groupList());
      groupMemory.on("groupsUpdated", function () {
        worker.port.emit("groupList", groupMemory.groupList());
      });
    }
    worker.port.on("ready", function () {
      emitGroupData();
    });
    Group.on("activationChanged", function () {
      emitGroupData();
    });
    worker.port.on("set-group-name", function (name) {
      var group = Group.forSdkTab(worker.tab);
      if (group) {
        group.setName(name);
      }
    });
    worker.port.on("start-new-group", function (groupData, openInCurrent) {
      if (! groupData) {
        groupData = groupMemory.makeNew();
      }
      var group = getGroup(groupData.groupId);
      if (groupData.name && ! group.name) {
        group.setName(groupData.name);
      }
      group.activateOrCreate(openInCurrent);
    });
    worker.port.on("copy-invite-link", function () {
      var group = Group.forSdkTab(worker.tab);
      if (! group) {
        return;
      }
      var inviteLink = inviteWatcher.INVITE_BASE + encodeURIComponent(group.groupId);
      // FIXME: obviously hacky
      group._sidebarOn.copyToClipboard.call(group, inviteLink);
    });
    worker.port.on("remove-group", function (groupId) {
      groupMemory.removeGroup(groupId);
    });
    worker.port.on("end-session", function () {
      var group = Group.forSdkTab(worker.tab);
      if (group) {
        group.sidebar.hide();
      }
    });
  }

});
