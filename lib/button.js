/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint forin:true, noarg:false, noempty:true, eqeqeq:true, bitwise:true,
  strict:true, undef:true, curly:false, browser:true,
  unused:true,
  indent:2, maxerr:50, devel:true, node:true, boss:true, white:true,
  globalstrict:true, nomen:false, newcap:true, moz: true */

/*global */

"use strict";

var tabs = require("sdk/tabs");
var self = require("sdk/self");
var widgets = require("sdk/widget");

let iconpath = self.data.url("sidebar/assets/icn-hotdish-orange-crop-20.png");
console.log(iconpath);
let startHotdish = function () {
  // open sidebar, convert into dish
  tabs.open("http://www.mozilla.org/"); // special side
  // special message?
};

// old, pre-australis firefox
let createWidget = function () {
  return widgets.Widget({
    id: "australis-hotdish-widget",
    label: "Hotdish!",
    contentURL: iconpath,
    onClick: function () {
      startHotdish();
    }
  });
};

let createOldButton = function () {
  var toolbarbutton = require("vendor/tbbcomplete/toolbarbutton");
  let button = toolbarbutton.ToolbarButton({
    id: "hotdish",
    label: "Hotdish!",
    tooltiptext: "Starts Up Hotdish",
    image: iconpath,
    onCommand: function () {
      console.log("Addon Button Clicked");
      startHotdish();
      //button.button().setAttribute('image', data.url("mozilla.png")); // Change the button's icon
    }
  });
  button.moveTo({
    toolbarID: "nav-bar",
    forceMove: true
  });
};

let createAustralisButton = function () {
  var {Button} = require("sdk/ui/button");
  // fancy new australis
  return Button({
    id: "australis-hotdish-button",
    label: "Hotdish",
    contentURL: iconpath,
    onClick: startHotdish
  });
};

let ourtoolbarbutton;

try {
  ourtoolbarbutton = createAustralisButton();
} catch(e) {
  console.warn("NO AUSTRALIS\n",e);
  try {
    ourtoolbarbutton = createOldButton();
  } catch(e) {
    console.warn("NO OLDBUTTON\n",e);
    ourtoolbarbutton = createWidget();
  }
}

exports.ourtoolbarbutton = ourtoolbarbutton;
