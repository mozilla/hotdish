var groupId;
var selfIdentity;
var clientId;

var hub = mixinEvents({});

addon.port.on("init", function (options) {
  groupId = options.groupName;
  selfIdentity = options.selfIdentity;
  clientId = options.selfIdentity.clientId;
  //$("#header").text("Hotdish " + groupName);
  if (docReady) {
    init();
  }
});

addon.port.emit("ready-init");

var list = {
  _peers: {},
  get: function (clientId) {
    if (! this._peers[clientId]) {
      var peer = Peer(clientId);
      this._peers[clientId] = peer;
    }
    return this._peers[clientId];
  }
};

var Peer = Class({
  constructor: function (id) {
    this.clientId = id;
    this.avatar = null;
    this.name = null;
    this.color = null;
    this.isSelf = this.clientId == clientId;
    this.element = getTemplate("peer");
    $("#peers").append(this.element);
    this.update({});
    this.tabs = {};
    this.activeTabId = null;
  },

  update: function (msg) {
    this.avatar = msg.avatar || this.avatar;
    this.name = msg.name || this.name;
    this.color = msg.color || this.color;
    if (this.name) {
      this.element.find(".name").text(this.name);
    }
    if (this.color) {
      this.element.find(".bgcolor").css("background-color", this.color);
    }
    if (this.avatar) {
      this.element.find(".avatar").show().attr("src", this.avatar);
    } else {
      this.element.find(".avatar").hide();
    }
    if (this.isSelf) {
      this.element.find("if-self").show();
    } else {
      this.element.find("if-self").hide();
    }
  },

  updateTab: function (msg) {
    if (! this.tabs[msg.tabid]) {
      this.tabs[msg.tabid] = {id: msg.tabid};
    }
    var t = this.tabs[msg.tabid];
    assert(t.id == msg.tabid);
    t.windowid = msg.windowid;
    t.index = msg.index;
    if (msg.pinned !== undefined) {
      t.pinned = msg.pinned;
    }
    if (msg.title !== undefined) {
      t.title = msg.title;
    }
    if (msg.url !== undefined) {
      t.url = msg.url;
    }
    if (msg.favicon !== undefined) {
      t.favicon = msg.favicon;
    }
    this.viewTabs();
  },

  tabEl: function (tabId) {
    return $("#tab-" + this.clientId + "-" + tabId);
  },

  makeTabEl: function (tabId) {
    var el = getTemplate("tab");
    el.attr("id", "tab-" + this.clientId + "-" + tabId);
    return el;
  },

  activateTab: function (msg) {
    var t;
    if (this.activeTabId) {
      t = this.tabEl(this.activeTabId);
      t.removeClass("active-tab");
    }
    this.activeTabId = msg.tabid;
    t = this.tabEl(this.activeTabId);
    t.addClass("active-tab");
    var parent = t.closest("ul, ol");
    t.remove();
    parent.prepend(t);
  },

  viewTabs: function () {
    var tabs = [];
    var urlList = this.element.find(".url-list");
    for (var tabId in this.tabs) {
      var tab = this.tabs[tabId];
      tabs.push(tab);
      var el = this.tabEl(tab.id);
      if (! el.length) {
        el = this.makeTabEl(tab.id);
        urlList.append(el);
      }
      el.find("a").attr("href", tab.url);
      if (tab.pinned) {
        el.find("a").addClass("pinned");
      } else {
        el.find("a").removeClass("pinned");
      }
      el.find(".title").text(tab.title || tab.url);
      if (tab.favicon) {
        el.find(".favicon").show().attr("src", tab.favicon);
      } else {
        el.find(".favicon").hide();
      }
    }
    tabs.sort(function (a, b) {
      return a.index < b.index;
    });
    for (var i=tabs.length-1; i>=0; i--) {
      tab = tabs[i];
      urlList.prepend(this.tabEl(tab.id));
      $("#request-current").show();
      $('.link').tooltip();
    }
  }

});


function getTemplate(name) {
  var el = $("#template-" + name);
  assert(el.length, "No template with the name", name);
  el = el.clone();
  el.attr("id", null);
  return el;
}


function init() {

  function message(msg) {
    var li = getTemplate("message");
    li.find("pre").text(JSON.stringify(msg, null, 2));
    $("#messages").append(li);
    if (msg.type == "init-connection") {
      return;
    }
    msg.peer = list.get(msg.clientId);
    if (msg.type == "hello" || msg.type == "hello-back") {
      msg.peer.update(msg);
    }
    hub.emit(msg.type, msg);
  };

  addon.port.on("message", message);
  addon.port.on("internalMessage", function (msg) {
    msg.self = true;
    msg.clientId = clientId;
    msg.peer = selfIdentity;
    message(msg);
  });

  $("#request-current").click(function () {
    addon.port.emit("shareTab");
  });

  $("#show-messages").click(function () {
    $("#messages-container").show();
    $("#messages-hidden").hide();
  });

  $("#hide-messages").click(function () {
    $("#messages-container").hide();
    $("#messages-hidden").show();
  });

  function send(msg) {
    addon.port.emit("send", msg);
  }

  function ignoreTab(msg) {
    return msg.url.indexOf("about:") === 0 ||
        msg.url.indexOf("resource:") === 0;
  }

  hub.on("pageshow", function (msg) {
    assert(msg.tab, "No tab in pageshow message");
    if (! ignoreTab(msg.tab)) {
      msg.peer.updateTab(msg.tab);
    }
  });

  hub.on("activate", function (msg) {
    assert(msg.tab, "No tab in activate message");
    if (! ignoreTab(msg.tab)) {
      msg.peer.activateTab(msg.tab);
    }
  });

  hub.on("tab-init", function (msg) {
    assert(msg.tabs, "No tabs in tab-init message");
    msg.tabs.forEach(function (tab) {
      if (! ignoreTab(tab)) {
        msg.peer.updateTab(tab);
      }
    });
  });

  $(document).on("click", ".push", function (ev) {
    addon.port.emit("push");
    return false;
  });

  function updateSelf() {
    message({
      type: "hello",
      avatar: selfIdentity.avatar,
      name: selfIdentity.name,
      color: selfIdentity.color,
      clientId: clientId
    });
  }

  addon.port.on("init", updateSelf);

  updateSelf();

  addon.port.emit("ready");

}

var docReady = false;

$(function () {
  docReady = true;
  if (selfIdentity) {
    init();
  }
});
