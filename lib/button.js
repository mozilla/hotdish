/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var tabs = require("sdk/tabs");
var self = require("sdk/self");
var widgets = require("sdk/widget");

let iconpath = self.data.url("sidebar/temp-images/avatar-4.jpg");
console.log(iconpath);
let startHotdish = function () {
	// open sidebar, convert into dish
	tabs.open("http://www.mozilla.org/"); // special side
  // special message?
}

// old, pre-australis firefox
var widget = widgets.Widget({
  id: "australis-hotdish-widget",
  label: "Hotdish!",
  contentURL: iconpath,
  onClick: function() {
  	startHotdish();
  }
});

try {
	var {Button} = require("sdk/ui/button");

	// fancy new australis
	var tbb = Button({
	  id: "australis-hotdish-button",
	  label: "Hotdish",
	  contentURL: iconpath,
		onClick: startHotdish
	})
} catch (e) {
	console.warn (e);
}
