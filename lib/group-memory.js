const myprefs = require("sdk/simple-prefs").prefs;
const simplePrefs = require("sdk/simple-prefs");
const { EventMethods, assert, generateId } = require("utils");
const { Class } = require('sdk/core/heritage');

var DEFAULT_GROUPS = {
  hotdishgroup: {
    groupId: "hotdishgroup",
    name: "Hotdish Developers"
  }
};

exports.GroupMemory = Class({

  extends: EventMethods,

  initialize: function () {
    simplePrefs.on("knownGroups", (function () {
      this._parsePrefs();
      this.emit("groupsUpdated");
    }).bind(this));
    this._parsePrefs();
  },

  _parsePrefs: function () {
    var knownGroups = myprefs.knownGroups;
    if (! knownGroups) {
      knownGroups = JSON.stringify(DEFAULT_GROUPS);
    }
    this._known = JSON.parse(knownGroups);
    console.log("initialize", this._known);
  },

  makeNew: function () {
    return {
      groupId: generateId(),
      name: null
    };
  },

  groupList: function () {
    var result = [];
    for (var id in this._known) {
      result.push(this._known[id]);
    }
    result.sort(function (a, b) {
      var aTime = a.time || 0;
      var bTime = b.time || 0;
      return aTime > bTime;
    });
    return result;
  },

  addGroup: function (group) {
    assert(typeof group.groupId == "string");
    this._known[group.groupId] = group;
    this._serialize();
  },

  _serialize: function () {
    myprefs.knownGroups = JSON.stringify(this._known);
  },

  removeGroup: function (groupId) {
    assert(typeof groupId == "string");
    delete this._known[groupId];
    this._serialize();
  }

});

exports.groupMemory = exports.GroupMemory();
