var groupId;
var selfIdentity;
var clientId;

if (location.href.search(/debug/) != -1) {
  var match = /groupId=([^&]*)/.exec(location.href);
  groupId = match[1];
  clientId = "testself";
  selfIdentity = {
    name: "Test Self",
    clientId: clientId,
    color: "#f00",
    avatar: null
  };
  addon = {
    _ons: {},
    port: {
      on: function (type, handler) {
        if (! addon._ons[type]) {
          addon._ons[type] = [];
        }
        addon._ons[type].push(handler);
      },
      emit: function (type) {
        console.log.apply(console, ["EMIT"].concat(Array.prototype.slice.call(arguments)));
      },
      localEmit: function (type) {
        var args = Array.prototype.slice.call(arguments, 1);
        var ons = addon._ons[type] || [];
        ons.forEach(function (handler) {
          handler.apply(null, args);
        });
      }
    }
  };

  var fakers = 0;

  function debugSend(msg) {
    if (! msg.clientId) {
      msg.clientId = "faker" + fakers;
    }
    console.log("Internal send:", msg);
    addon.port.localEmit("message", msg);
  }

  $(function () {
    document.documentElement.classList.add("debug-html");
    document.body.classList.add("debug");
    var iframeSrc = "./listener.html?groupId=" + groupId;
    var iframe = $("<iframe>").attr("src", iframeSrc).attr("id", "debug-listener");
    $("#debug-panel").append($("<div>").append(iframe));
    var addTabIndex = 0;
    $("#add-tab").click(function () {
      var local = $("#add-tab-local").prop("checked");
      debugSend({
        type: "pageshow",
        clientId: local ? clientId : null,
        tab: {
          windowid: 0,
          tabid: parseInt($("#add-tab-tabid").val(), 10),
          index: addTabIndex++,
          pinned: false,
          title: "Some page " + addTabIndex,
          url: $("#add-tab-url").val(),
          favicon: null
        }
      });
      $("#add-tab-url").val("");
      $("#add-tab-tabid").val(parseInt($("#add-tab-tabid").val(), 10) + 11);
    });
    $("#add-person").click(function () {
      fakers++;
      debugSend({
        type: "hello",
        name: "Faker " + fakers,
        avatar: null,
        color: "#" + fakers + "f" + fakers,
        clientId: "faker" + fakers
      });
    });
  });

  var source;

  document.documentElement.addEventListener("hotdish-message", function (event) {
    console.log("got message", event.detail);
  }, false);

  var i=0;
  setInterval(function () {
    i++;
    var event = document.createEvent('CustomEvent');
    console.log("sendit!");
    event.initCustomEvent("hotdish-send", true, true, {type: "yo", i: i});
    document.documentElement.dispatchEvent(event);
  }, 1000);

}
