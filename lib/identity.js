/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const myprefs = require("sdk/simple-prefs").prefs;
const simplePrefs = require("sdk/simple-prefs");
const { env } = require("sdk/system");
const uuid = require('sdk/util/uuid').uuid;
const { Class } = require('sdk/core/heritage');
const { EventMethods } = require("utils");

function uniqueId() {
  return uuid().number.slice(1, -1);
};

var stringToColor = function(str) {
  // str to hash
  var i, hash, color;
  for (i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash));
  // int/hash to hex
  for (i = 0, color = "#"; i < 3; color += ("00" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2));
  return color;
};

exports.SelfIdentity = Class({

  extends: EventMethods,

  initialize: function () {
    // Note: we must use .username for the pref, .name acts weird:
    myprefs.username = myprefs.username || env['USER'] || env['LOGNAME'];
    this.name = myprefs.username;
    myprefs.color = myprefs.color || stringToColor(myprefs.name);
    this.color = myprefs.color;
    myprefs.clientId = myprefs.clientId || uniqueId();
    this.clientId = myprefs.clientId;
    this.avatar = myprefs.avatar;
    simplePrefs.on("username", (function () {
      this.name = myprefs.username;
      this.emit("update");
    }).bind(this));
    simplePrefs.on("color", (function () {
      this.color = myprefs.color;
      this.emit("update");
    }).bind(this));
    simplePrefs.on("clientId", (function () {
      // FIXME: should just ask the browser to be restarted here
    }).bind(this));
    simplePrefs.on("avatar", (function () {
      this.avatar = myprefs.avatar;
      this.emit("update");
    }).bind(this));
  }

});

exports.selfIdentity = exports.SelfIdentity();
