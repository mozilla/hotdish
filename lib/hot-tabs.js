/*jshint forin:true, noarg:false, noempty:true, eqeqeq:true, bitwise:true,
  strict:true, undef:true, curly:false, browser:true,
  unused:true,
  indent:2, maxerr:50, devel:true, node:true, boss:true, white:true,
  globalstrict:true, nomen:false, newcap:true, moz: true */

/*global */

"use strict";

const tabs = require("sdk/tabs");
const { eventOf, winIdFromTab } =  require("./tracking-utils");

const hub = require("hub").hub;

let describeTab = function(tab) {
  return {
    group: "tabs",
    windowid: winIdFromTab(tab),
    // tab properties
    tabid:   tab.id,
    index:  tab.index,
    pinned: tab.isPinned,
    title: tab.title,
    url: tab.url,
    favicon: tab.favicon
  };
};


let sendif= function(windowouterid){
  return function(msg){
	if (windowouterid === msg.windowid) {
	  console.log("sending", JSON.stringify(msg));
	  hub.send(msg);
	} else {
	  console.log("NOT sending", JSON.stringify(msg));
	}
  };
};

let basicTabEvents = exports.basicTabEvents = function(windowouterid) {
	let send = sendif(windowouterid);
  tabs.on("open", function(tab) {
    send(eventOf("tab-open", describeTab(tab)));
  });
  /*tabs.on("ready", function(tab) {
    send(eventOf("tab-ready", describeTab(tab)));
  });*/
  tabs.on("activate", function(tab) {
    send(eventOf("tab-activate", describeTab(tab)));
  });
  /*tabs.on("deactivate", function(tab) {
    send(eventOf("tab-deactivate", describeTab(tab)));
  });*/
  tabs.on("close", function(tab) {
    send(eventOf("tab-close", describeTab(tab)));
  });
  /* when this lands in 1.14 we can use this */
  tabs.on("pageshow", function(tab,persist) {
    let e = eventOf("tab-pageshow", describeTab(tab));
    //e.persist = persist;
    send(e);
  });
};


let describeTab = function(tab) {
  return {
    group: "tabs",
    windowid: winIdFromTab(tab),
    // tab properties
    tabid:   tab.id,
    index:  tab.index,
    pinned: tab.isPinned,
    title: tab.title,
    url: tab.url
    //favicon: tab.favicon
  }
};
