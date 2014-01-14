/* These are models for all the stuff we're keeping track of
   Ideally no UI will be in here */


var peers = {};
var activities = [];

function getPeer(id) {
  assert(id, "Bad id for getPeer:", id);
  if (! peers[id]) {
    peers[id] = Peer(id);
  }
  return peers[id];
}

function allPeers() {
  var result = [];
  for (var id in peers) {
    result.push(getPeer(id));
  }
  return result;
}

var Peer = Class(mixinEvents({
  constructor: function (id) {
    this.id = id;
    this.avatar = null;
    this.name = null;
    this.color = null;
    this.isSelf = this.id == clientId;
    this.tabs = {};
    this.lastMessage = Date.now();
  },

  update: function (msg) {
    this.avatar = msg.avatar || this.avatar;
    this.name = msg.name || this.name;
    this.color = msg.color || this.color;
  },

  getTab: function (tabId) {
    if (! this.tabs[tabId]) {
      this.tabs[tabId] = Tab(this, tabId);
    }
    return this.tabs[tabId];
  },

  allTabs: function () {
    var result = [];
    for (var id in this.tabs) {
      result.push(this.tabs[id]);
    }
    return result;
  },

  setActiveTab: function (tabId) {
    for (var id in this.tabs) {
      if (id == tabId) {
        this.tabs[id].active = true;
      } else {
        this.tabs[id].active = false;
      }
    }
  }

}));

addon.port.on("peer", function (msg, joined) {
  var peer = getPeer(msg.clientId);
  peer.update(msg);
  if (joined) {
    activities.push(JoinActivity(peer));
  }
});

var Tab = Class({
  constructor: function (peer, tabId) {
    this.peer = peer;
    this.id = tabId;
    this.live = true;
    // FIXME: not sure this is good to do as a bool on each item,
    // as opposed to an attribute on peer:
    this.active = false;
    this.history = [];
    this.currentTitle = null;
    this.currentUrl = null;
    this.time = Date.now();
  },
  addPage: function (page) {
    if (this.history.length && page.url == this.history[this.history.length-1].url) {
      // A re-add of an existing page
      return;
    }
    page.tab = this;
    this.history.push(page);
    this.currentTitle = page.title;
    this.currentUrl = page.url;
    this.time = Date.now();
  }
});

var Page = Class({
  constructor: function (url, title) {
    // FIXME: wish we had a stable ID here
    this.url = url;
    this.title = title;
    this.tab = null;
    this.time = Date.now();
  }
});

hub.on("pageshow", function (msg) {
  var page = Page(msg.tab.url, msg.tab.title);
  var tab = msg.peer.getTab(msg.tab.id);
  tab.addPage(page);
});

hub.on("tab-init", function (msg) {
  msg.tabs.forEach(function (t) {
    var page = Page(t.url, t.title);
    var tab = msg.peer.getTab(t.id);
    tab.addPage(page);
  });
});

hub.on("activate", function (msg) {
  var tab = msg.peer.setActiveTab(msg.tab.id);
});

hub.on("close", function (msg) {
  var tab = msg.peer.getTab(msg.tab.id);
  tab.live = false;
});

var ChatMessage = Class({
  constructor: function (peer, text) {
    this.peer = peer;
    this.text = text;
    this.time = Date.now();
  }
});

addon.port.on("chat", function (msg) {
  var peer = getPeer(msg.clientId);
  var chatMessage = ChatMessage(peer, msg.text);
  activities.push(chatMessage);
});

var JoinActivity = Class({
  constructor: function (peer) {
    this.peer = peer;
    this.time = Date.now();
  }
});

var PushActivity = Class({
  constructor: function (peer, url, title, localTabId, reloaded) {
    this.peer = peer;
    this.url = url;
    this.localTabId = localTabId;
    this.reloaded = reloaded;
    this.time = Date.now();
  }
});

addon.port.on("push", function (msg, localTabId, reloaed) {
  var peer = getPeer(msg.clientId);
  var push = PushActivity(peer, msg.url, msg.title || msg.url, localTabId, reloaded);
  activities.push(push);
});

var JoinedMirror = Class({
  constructor: function (peer, localTabId) {
    this.peer = peer;
    this.localTabId = localTabId;
    this.time = Date.now();
  }
});

addon.port.on("joinedMirror", function (msg, localTabId) {
  var peer = getPeer(msg.clientId);
  var joined = JoinedMirror(peer, localTabId);
  activities.push(joined);
});

function dumpState() {
  var lines = [];
  lines.push('Self: ' + clientId);
  for (var peerId in peers) {
    var peer = peers[peerId];
    lines = lines.concat([
      'Peer: ' + peer.id + (peer.isSelf ? ' SELF' : ''),
      '  name: ' + peer.name,
      '  avatar: <img src="' + peer.avatar + '">',
      '  color: ' + peer.color,
      '  tabs:']);
    for (var tabId in peer.tabs) {
      var tab = peer.tabs[tabId];
      lines = lines.concat([
        '    Tab ID ' + tab.id + (tab.live ? '' : ' DEAD'),
        '      url: ' + tab.currentUrl,
        '      title: ' + tab.currentTitle
      ]);
      tab.history.forEach(function (p, index) {
        if (! index) {
          return;
        }
        lines.push('      history: ' + p.url);
      });
    }
  }
  lines.push('Activities:');
  activities.forEach(function (a) {
    if (a instanceof ChatMessage) {
      lines.push('  Chat from ' + a.peer.name + ' at ' + a.time);
      lines.push('    ' + a.text);
    } else if (a instanceof JoinActivity) {
      lines.push('  Joined Session: ' + a.peer.name + ' at ' + a.time);
    } else if (a instanceof PushActivity) {
      lines.push('  Push from ' + a.peer.name + ' at ' + a.time);
      lines.push('    url: ' + a.url);
      lines.push('    resulted in: ' + a.localTabId + (a.reloaded ? ' RELOAD' : ''));
    } else if (a instanceof JoinedMirror) {
      lines.push('  Joined Mirror ' + a.peer.name);
      lines.push('    joined tab: ' + a.localTabId);
    } else {
      lines.push('Unknown activity: ' + JSON.stringify(a));
    }
  });
  return lines.join("\n");
}

var sidebarApp = angular.module("sidebarApp", []);

sidebarApp.controller("ActivityCtrl", function ($scope) {
  var a = $scope.activities = [];
  allPeers().forEach(function (p) {
    p.allTabs().forEach(function (t) {
      a.push(t);
    });
  });
  activities.forEach(function (activity) {
    a.push(activity);
  });
  a.sort(function (a, b) {
    return b.time - a.time;
  });
  setInterval(function () {
    $scope.$digest();
  }, 1000);
  console.log("got scope");
});

sidebarApp.controller("UserListCtrl", function ($scope) {
  $scope.peers = allPeers();
});
