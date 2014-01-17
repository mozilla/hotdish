/* These are models for all the stuff we're keeping track of
   Ideally no UI will be in here */


var peers = {};
var activities = [];

function makeId(name) {
  name = name || "obj";
  makeId.counter++;
  return name + makeId.counter;
}
makeId.counter = 0;

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
    renderUsers();
  },

  update: function (msg) {
    this.avatar = msg.avatar || this.avatar;
    this.name = msg.name || this.name;
    this.color = msg.color || this.color;
    renderUsers();
    renderActivity();
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
    renderActivity();
  }

}));

addon.port.on("peer", function (msg, joined) {
  var peer = getPeer(msg.clientId);
  peer.update(msg);
  if (joined) {
    activities.push(JoinActivity(peer));
  }
  renderActivity();
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
  current: function () {
    if (this.history.length) {
      return this.history[this.history.length-1];
    } else {
      var blank = Page("about:blank", "");
      blank.tab = this;
      return blank;
    }
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
  },
  activityComponent: function () {
    return UI.PageVisit({
      name: this.peer.name,
      avatar: this.peer.avatar,
      page: this.current()
    });
  }
});

var Page = Class({
  constructor: function (url, title) {
    // FIXME: wish we had a stable ID here
    this.id = makeId("page");
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
  renderActivity();
});

hub.on("tab-init", function (msg) {
  msg.tabs.forEach(function (t) {
    var page = Page(t.url, t.title);
    var tab = msg.peer.getTab(t.id);
    tab.addPage(page);
  });
  renderActivity();
});

hub.on("activate", function (msg) {
  var tab = msg.peer.setActiveTab(msg.tab.id);
  renderActivity();
});

hub.on("close", function (msg) {
  var tab = msg.peer.getTab(msg.tab.id);
  tab.live = false;
  renderActivity();
});

var ChatMessage = Class({
  constructor: function (peer, text) {
    this.id = makeId("chat");
    this.peer = peer;
    this.text = text;
    this.time = Date.now();
  },
  activityComponent: function () {
    return UI.Chat({
      name: this.peer.name,
      avatar: this.peer.avatar,
      time: this.time,
      text: this.text,
      key: this.id
    });
  }
});

addon.port.on("chat", function (msg) {
  var peer = getPeer(msg.clientId);
  var chatMessage = ChatMessage(peer, msg.text);
  activities.push(chatMessage);
  renderActivity();
});

var JoinActivity = Class({
  constructor: function (peer) {
    this.id = makeId("join");
    this.peer = peer;
    this.time = Date.now();
  },
  activityComponent: function () {
    return UI.Join({
      name: this.peer.name,
      avatar: this.peer.avatar,
      time: this.time,
      key: this.id
    });
  }
});

var PushActivity = Class({
  constructor: function (peer, url, title, localTabId, reloaded) {
    this.id = makeId("push");
    this.peer = peer;
    this.url = url;
    this.localTabId = localTabId;
    this.reloaded = reloaded;
    this.time = Date.now();
  },
  activityComponent: function () {
    throw new Error("Not implemented");
  }
});

addon.port.on("push", function (msg, localTabId, reloaed) {
  var peer = getPeer(msg.clientId);
  var push = PushActivity(peer, msg.url, msg.title || msg.url, localTabId, reloaded);
  activities.push(push);
  renderActivity();
});

var JoinedMirror = Class({
  constructor: function (peer, localTabId) {
    this.id = makeId("joinedMirror");
    this.peer = peer;
    this.localTabId = localTabId;
    this.time = Date.now();
  },
  activityComponent: function () {
    throw new Error("Not implemented");
  }
});

addon.port.on("joinedMirror", function (msg, localTabId) {
  var peer = getPeer(msg.clientId);
  var joined = JoinedMirror(peer, localTabId);
  activities.push(joined);
  renderActivity();
});

/************************************************************
 * UI event handling
 ************************************************************/

UI.events.on("spectate", function (page) {
  addon.port.emit("joinMirror", page.tab.id);
});



/************************************************************
 * Rendering
 ************************************************************/

var userGrid;

function renderUsers() {
  if (! userGrid) {
    userGrid = UI.UserGrid();
    $("#user-container").empty();
    React.renderComponent(userGrid, $("#user-container")[0]);
  }
  var users = [UI.SelfAvatar({avatar: selfIdentity.avatar})];
  allPeers().forEach(function (p) {
    if (p.isSelf) {
      return;
    }
    users.push(UI.PeerAvatar({avatar: p.avatar, name: p.name}));
  });
  userGrid.setState({users: users});
}

var activityList;

function renderActivity() {
  if (! activityList) {
    activityList = UI.ActivityList();
    $("#activity-stream-container").empty();
    React.renderComponent(activityList, $("#activity-stream-container")[0]);
  }
  var sorted = activities.slice();
  allPeers().forEach(function (p) {
    sorted = sorted.concat(p.allTabs());
  });
  sorted.sort(function (a, b) {return a.time < b.time;});
  var children = sorted.map(function (i) {return i.activityComponent();});
  activityList.setState({activities: children});
}

var chatField;

function renderChatField() {
  if (! chatField) {
    chatField = UI.ChatField({
      onChatSubmit: function (text) {
        addon.port.emit("chat", text);
        activities.push(ChatMessage(getPeer(clientId), text));
        renderActivity();
      }
    });
    $("#chat-field-container").empty();
    React.renderComponent(chatField, $("#chat-field-container")[0]);
  }
}

function dumpState() {
  var lines = [];
  lines.push('Self: ' + clientId);
  for (var peerId in peers) {
    var peer = peers[peerId];
    lines = lines.concat([
      'Peer: ' + peer.id + (peer.isSelf ? ' SELF' : ''),
      '  name: ' + peer.name,
      '  avatar: <img height=40 width=40 src="' + peer.avatar + '">',
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
