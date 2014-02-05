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

self.port.emit("ready");
