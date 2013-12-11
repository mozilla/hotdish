/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint forin:true, noarg:false, noempty:true, eqeqeq:true, bitwise:true,
  strict:true, undef:true, curly:false, browser:true,
  unused:true,
  indent:2, maxerr:50, devel:true, node:true, boss:true, white:true,
  globalstrict:true, nomen:false, newcap:true, moz: true */

/*global */

let myprefs = require("sdk/simple-prefs").prefs;
let { env } = require("sdk/system");

const uuid = require('sdk/util/uuid').uuid;

/** Random UUID as string, without braces.
 *
 * @return {string} random uuid without braces
 *
 * @memberOf configure-user
 * @name uu
 */
let uu = exports.uu = function () {
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

let configure = exports.configure = function () {
  myprefs.username = myprefs.username || env['USER'] || env['LOGNAME'];
  myprefs.color = myprefs.color || stringToColor(myprefs.name);
  myprefs.clientId = myprefs.clientId || uu();
};
