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

window.addEventListener("set-avatar",function(evt) {
  self.port.emit('set-avatar',evt.detail.imgdata);
});

/************************************************************
 Name input
*/

var nameInput = document.querySelector("#name-input");
self.port.on("set-name", function (name) {
  nameInput.value = name;
});

function updateName() {
  if (nameInput.value) {
    self.port.emit("set-name", nameInput.value);
  }
}

var updater;
function updateNameSoon() {
  clearTimeout(updater);
  updater = setTimeout(updateName, 500);
}

nameInput.addEventListener("change", updateName, false);
nameInput.addEventListener("keyup", updateNameSoon, false);

/************************************************************
 Group Name input
*/

var groupNameInput = document.querySelector("#group-name");

function updateGroupName() {
  if (groupNameInput.value) {
    self.port.emit("set-group-name", groupNameInput.value);
  }
}

var groupUpdater;
function updateGroupNameSoon() {
  clearTimeout(groupUpdater);
  groupUpdater = setTimeout(updateGroupName, 500);
}

groupNameInput.addEventListener("change", updateGroupName, false);
groupNameInput.addEventListener("keyup", updateGroupNameSoon, false);

/************************************************************
 This group and group list
*/

var thisGroup = document.querySelector("#this-group");
var groupList = document.querySelector("#group-list");
var openInCurrent = document.querySelector("#open-in-current");
var inviteLink = document.querySelector("#invite-link");
var inviteLinkUrl = null;

self.port.on("thisGroup", function (groupData) {
  if (! groupData) {
    thisGroup.style.display = "none";
    groupList.style.display = "";
    inviteLinkUrl = inviteLink.value = "";
    document.body.classList.add("no-group");
    document.body.classList.remove("in-group");
  } else {
    thisGroup.style.display = "";
    groupList.style.display = "none";
    inviteLinkUrl = inviteLink.value = groupData.inviteLink;
    groupNameInput.value = groupData.name;
    document.body.classList.remove("no-group");
    document.body.classList.add("in-group");
  }
});

document.querySelector("#copy-invite-link").addEventListener("click", function () {
  self.port.emit("copy-invite-link");
});

inviteLink.addEventListener("change", function () {
  if (inviteLinkUrl) {
    inviteLink.value = inviteLinkUrl;
  }
});

inviteLink.addEventListener("focus", function () {
  inviteLink.select();
});

document.querySelector("#end-session").addEventListener("click", function () {
  self.port.emit("end-session");
});

self.port.on("groupList", function (list) {
  var tmpl = document.querySelector("#group-template");
  var container = document.querySelector("#group-list-items");
  container.innerHTML = "";
  list.forEach(function (groupData) {
    var el = tmpl.cloneNode(true);
    el.id = "";
    var button = el.querySelector("button.start");
    button.setAttribute("data-group", JSON.stringify(groupData));
    button.textContent = groupData.name || groupData.groupId;
    button.addEventListener("click", function () {
      self.port.emit("start-new-group", groupData, openInCurrent.checked);
    });
    var remove = el.querySelector("button.remove");
    remove.addEventListener("click", function () {
      if (window.confirm("Are you sure you want to forget this group?")) {
        self.port.emit("remove-group", groupData.groupId);
      }
    });
    container.appendChild(el);
  });
});

document.querySelector("#start-new-group").addEventListener("click", function () {
  self.port.emit("start-new-group", null, openInCurrent.checked);
});

self.port.emit("ready");
