/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

/*jshint forin:true, noarg:false, noempty:true, eqeqeq:true, bitwise:true,
  strict:true, undef:true, curly:false, browser:true,
  unused:true,
  indent:2, maxerr:50, devel:true, node:true, boss:true, white:true,
  globalstrict:true, nomen:false, newcap:true, moz: true */

/*global */

const promises = require("sdk/core/promise");
const { defer, resolve } = require("sdk/core/promise");
const timers = require("sdk/timers");

const windows = require("sdk/windows").browserWindows;
let { isForeground, getForeground } = require("foreground-window");

/**
  */
let wait = function (ms) {
  let { promise, resolve } = defer();
  timers.setTimeout(resolve, ms);
  return promise;
};

let waitasec = function(){
  let { promise, resolve } = defer();
  return wait(1000).then(resolve);
};


let chain = function () {
  let p = promises.resolve(true);
  for (let arg of Array.prototype.slice.call(arguments, 0)) {
    if (typeof arg !== "function"){
      throw new Error("arg not a function, and can't be in promise chain:" + arg)
    }
    p = p.then(arg);
  }
  return p;
};
/*
exports["test chain works"] = function (assert, done) {
  let starttime = Date.now();
  chain(
    function () console.log("starting"),
    function () console.log('time:'),
    waitasec,
    waitasec,
    function () {
      let t = Date.now();
      assert.ok((t - starttime) > 2000, 'chaining works!')
    },
    done
  );
};


exports["test chain throws with any non functions"] = function (assert) {
  assert.throws(function() {
    chain(1);
  }, "chain throws with any non functions!");
};
*/

exports["test foreground.window window"] = function (assert, done) {

  let orig = windows.activeWindow;
  windows.activeWindow.activate();
  assert.ok(isForeground(windows.activeWindow),"active window is foreground.window");

  let current = windows.open({
    url: "about:addons",
    onOpen: function(window) {
        waitasec().then(function(){
        assert.ok(windows.activeWindow === window,"1, window is activeWindow");
        assert.ok(isForeground(windows.activeWindow),"3, active is new window");
        assert.ok(!isForeground(orig),"4, active is not old window");
        assert.ok(isForeground(window),"5, this window is active");
        assert.equal(getForeground(),window,"6, getForeground ok");
        wait(1000).then(done);
      })
    }
  });

};

require("sdk/test/runner").runTestsFromModule(module);
