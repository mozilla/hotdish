/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const windows = require("sdk/windows").browserWindows;

// set a starting value
let _foreground = windows.activeWindow;

exports.isForeground = function (sdkWindow) {
  return sdkWindow === _foreground;
}

exports.getForeground = function () {
  return _foreground;
}

let basicWindowEvents = function() {
  ['open','close','activate','deactivate'].forEach(function(k){
    windows.on(k,function(window){
      if (['activate'].indexOf(k) > -1) {
        _foreground = window;
     } else {
        if (k === 'deactivate' || (windows.activeWindow === null)) {
          _foreground = null;
        }
      }
    })
  });
}();
