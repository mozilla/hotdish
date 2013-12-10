"use strict";

const sysevents = require("sdk/system/events");
const {getTabs, getTabId, getOwnerWindow} = require("sdk/tabs/utils");
const {getOuterId,isWindowPrivate,isBrowser} = require("sdk/window/utils");
const {extend,merge} = require("sdk/util/object");
const tabs = require("tabs");
const {WindowTracker} = require("sdk/deprecated/window-utils");

const TOPIC = exports.TOPIC = "micropilot-user-events";

let override = exports.override = function() merge.apply(null, arguments)
let rawTabfromTab = function(tab) {
	if (!tab) return null;

	let rawTabs = getTabs();

	for (let rawTab of rawTabs) {
		if (getTabId(rawTab) === tab.id)
		return rawTab;
	}
	return null;
}

/**
* @param {action, desc} string action and object description
* @return jsonable-object event described by these parameters
*
* Note:  adds timestamp (ts) unless there is already an existing ts
*/
let eventOf = exports.eventOf = function(action, desc) {
	let evt = {};
	evt.ts = Date.now();
	evt = override(evt, desc);
	evt["type"] = action;
	return evt;
}

/**
* @param {tab} jetpack tab object
* @return id of the tab's parent window
*
*/
let winIdFromTab = exports.winIdFromTab = function(tab) {
	var rawTab = rawTabfromTab(tab);
	if (!rawTab) return null;
	var win = getOwnerWindow(rawTab);
	if (!win) return null;
	return getOuterId(win);
}

/**
* @param {obj} data event to emit
* emits to "micropilot-user-actions"
* @return obj
*/
let emit = exports.emit = function(obj) {
	var valid_obj = validateDataObj(obj);
	if (!valid_obj) return null;
	let s;
	try {
		s = JSON.stringify(valid_obj)
		sysevents.emit(TOPIC,{subject:null,data:s});
	} catch (e){
		console.error("unable to stringify",s.group)
	}
	return valid_obj;
};

/**
* @param {obj} data event to emit
* ensures any field with tab id has a window id; other criteria? To update later
* @return object to emit; null if inconsistencies
*/
let validateDataObj = function(obj) {
	return obj;
}


/** click obj from evt
  */
let aboutClick = exports.aboutClick = function(clickEvt,window){
  let out = {};
  Array.forEach(["pageX","pageY", "clientX","clientY","button","buttons"],function(k){
    out[k] = clickEvt[k];
    // yes, this ignores retina
    out.browserX = clickEvt.screenX - window.mozInnerScreenX;
    out.browserY = clickEvt.screenY - window.mozInnerScreenY;
    // yes, this is gross, but less gross than listening for resize
    out.w = window.document.width;
    out.h = window.document.height;
  })
  return out;

}


/** simplified tracker
  */
let Track = exports.Track = function(fn) WindowTracker({ onTrack: fn});

/** only run on browser only
  */
let browserOnly = exports.browserOnly = function(fn) {
  return function(window) {
    if (!isBrowser(window)) return
    fn(window)
  }
}


/**
  */
let tabAndWindowIds = exports.tabAndWindowIds = function(appwindow,tab){
  return {tabid: tab !== undefined? tab.id : tabs.activeTab.id,
    windowid: appwindow !== undefined ? getOuterId(appwindow):  "FAKE"}
}

/**
	*/
let ancestors = exports.ancestors = function(el){
  var els = [];
  while (el) {
      els.unshift(el);
      el = el.parentNode;
  }
  return els;
}


let chromeWindowForBrowserWindow = function(){};
try {
  chromeWindowForBrowserWindow = require('sdk/private-browsing/window/utils').getOwnerWindow;
} catch (err){
	//complete hack to get id of BrowserWindow
  chromeWindowForBrowserWindow = function(window){
		let tabs = window.tabs;
		if (tabs.length === 0) return //
		return winIdFromTab(tabs[0]);
	}
}

exports.chromeWindowForBrowserWindow = chromeWindowForBrowserWindow;



