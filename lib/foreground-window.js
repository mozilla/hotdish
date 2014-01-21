/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const windows = require("sdk/windows").browserWindows;
const {getOuterId} = require("sdk/window/utils");
const {chromeWindowForBrowserWindow} =  require("./tracking-utils");

let _foregroundId = 0;

Object.defineProperty(exports,
  'foregroundId',
  {get : function(){ return _foregroundId; }});

let basicWindowEvents = function() {
  ['open','close','activate','deactivate','private'].forEach(function(k){
    windows.on(k,function(window){
      console.log("k:",k);
      if (['activate','open'].indexOf(k) > -1) {
        _foregroundId = getOuterId(chromeWindowForBrowserWindow(window))
      } else {
        _foregroundId = null;
      }
      //console.log("id is:", _foregroundId, exports.foregroundId);
    })
  });
}();
