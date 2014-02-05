/** @jsx React.DOM */
/* These are the React components we are using */

(function () {

var UI = window.UI = {};

UI.events = mixinEvents({});

var Timestamp = React.createClass({
  render: function () {
    var className = "time";
    if (this.props.pullRight) {
      className += " pull-right";
    }
    return (
      <span className={className} data-time={this.props.time}>{this.props.time}</span>
    );
  },
  componentDidMount: function (rootNode) {
    this.renderTime();
  },
  renderTime: function () {
    this.getDOMNode().textContent = moment(this.props.time).fromNow();
  }
});

moment.lang("en");  // configure moment
setInterval(function () { // age them, every 10 sec.
  $(".time").each(function () {
    this.textContent = moment(parseInt(this.getAttribute("data-time"), 10)).fromNow();
  });
}, 10000);


/* This is the avatar of yourself in the header */
var PeerAvatar = UI.PeerAvatar = React.createClass({
  avatarClick: function () {
    if (this.props.isSelf) {
      UI.events.emit("showCamera");
    } else {
      UI.events.emit("avatarClick", this.props.id);
    }
  },
  goToMe: function() {
    console.log('go to me');
  },
  render: function () {
    /*
            <a href="#" className="btn btn-default btn-sm" role="button">
          Take photo
        </a>
        <a href="#" className="btn btn-default btn-sm" role="button">
          Settings
        </a>
        <a href="#" className="btn btn-default btn-sm" role="button">
          Profile
        </a>
    */
    var style = {};
    if (this.props.avatar) {
      style.background = "url(" + this.props.avatar + ")";
      style.backgroundRepeat = "no-repeat";
      style.backgroundSize = "100%";
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
    }
    return (
      // should be show camera, if self, or go to person if not.  might have to split this!
      <div onClick={this.avatarClick} className="text-center fullheight selfAvatar" style={ style } key={this.props.id}>
        <p className='uname'>{this.props.name}</p>
      </div>
    );
  }
});

/* This is the big invite button */
UI.events.on("invite", function () {

  //$("#activity-view").hide();
  /* And then a blank space */
  $("#invite-panel").show();

  $("#invite-panel").animate({
    "left": "0px"
  }, 500);

  $(".btn-send-invites").click(function () {
    $("#invite-panel").animate({
      "left": "-400px"
    }, 500);
    inviteSent();
  });

  $(".btn-cancel-invites").click(function () {
    $("#invite-panel").animate({
      "left": "-400px"
    }, 500);
  });

});

var InviteAvatar = UI.InviteAvatar = React.createClass({
  render: function () {
    var colorList = "#AF81C9, #F89A7E, #F2CA85, #54D1F1, #7C71AD, #445569".split(", ");
    var bgcolor = colorList[this.props.n];
    var inviteOrWait = this.props.waiting ? <WaitingForUser /> : <InviteUser /> ;
    var style = {
      backgroundColor: bgcolor
    };
    return (
      <div className="text-center inviteNewperson fullheight"  style={style}>
        {inviteOrWait}
      </div>
    );
  }
});

var InviteUser = React.createClass({
  clickInvite: function () {
    UI.events.emit("invite");
    return false;
  },
  render: function () {
    // lineHeight is the height of the div, thus centering vertically
    return (
      <div className="inviteUserBtn" style={{fontSize: "50", lineHeight:"100px"}} onClick={this.clickInvite}>+
      </div>
    );
  }
});


var WaitingForUser = React.createClass({
  render: function () {
    return (
      <span className="waitingforuser" style={ {background: "url(assets/avatar.png) no-repeat center center", backgroundSize: "50px 50px", position: "absolute", top: "4px", left: "0px", padding: "6px", width: "100%", height: "100%"} }>
        Waiting for person...
      </span>
    );
  }
});




var UserGrid = React.createClass({
  getInitialState: function () {
    return {};
  },
  render: function () {
    var children = this.state.users || [];
    var numberToWaitFor = this.state.waiting;

    var blankId = 0;
    while (children.length < 6) {
      blankId++;
      var waiting = false;
      if (numberToWaitFor > 0) {
        waiting = true;
        numberToWaitFor--;
      }
      children.push(<InviteAvatar key={ 'blank' + blankId } n={blankId} waiting={waiting} />);
    }
    return (
      <div id="users" className="container-fluid">
        <div className="all-users-here-notification">Yay, everyone is here!</div>
        <div className="invites-sent-notification">Invites sent!</div>

        <div className="row">
          <div className="col-xs-4 nopad murderers-row"><div className="avatarOverlay" /> {children[0]} </div>
          <div className="col-xs-4 nopad murderers-row"><div className="avatarOverlay" /> {children[1]}</div>
          <div className="col-xs-4 nopad murderers-row"><div className="avatarOverlay" /> {children[2]}</div>
          <div className="col-xs-4 nopad murderers-row"><div className="avatarOverlay" /> {children[3]}</div>
          <div className="col-xs-4 nopad murderers-row"><div className="avatarOverlay" /> {children[4]}</div>
          <div className="col-xs-4 nopad murderers-row"><div className="avatarOverlay" /> {children[5]}</div>
        </div>
      </div>
    );
  }
});
UI.UserGrid = UserGrid;

var Activity = React.createClass({
  render: function () {
    return (
      <li className="media" key={this.props.key}>
        <a className="pull-left" href="#">
          <div className="sm-avatar">
            <img className="media-object user-avatar" src={this.props.avatar} alt="" />
          </div>
        </a>
        <div className="media-body">
          {this.props.children}
        </div>
      </li>
    );
  }
});

var Tooltip = React.createClass({
  componentDidMount: function () {
    $(this.getDOMNode()).tooltip();
  },
  componentDidUpdate: function () {
    $(this.getDOMNode()).tooltip("fixTitle");
  },
  render: function () {
    return this.props.children;
  }
});

var Dropdown = React.createClass({
  componentDidMount: function () {
    $(this.getDOMNode()).find("button").dropdown();
  },
  render: function () {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
});

/* This is a page visit activity */
var PageVisit = React.createClass({
  onSpectateClick: function () {
    UI.events.emit("spectate", this.props.page);
    return false;
  },
  render: function () {
    var joinLink = null;
    if (! this.props.page.tab.peer.isSelf) {
      joinLink = <Tooltip><a data-myid={this._myid} className="glyphicon glyphicon-eye-open pull-right spectate-page" href="#" title="Spectate on their page" data-toggle="tooltip" data-placement="left" onClick={this.onSpectateClick}></a></Tooltip>;
    }
    var title = this.props.page.title;
    if (this.props.state == "presenting") {
      title = "Presenting: " + title;
    } else if (this.props.state == "viewing") {
      title = "Viewing: " + title;
    }
    var star = null;
    if (this.props.active) {
      star = <span style={ {marginLeft: "4px", color: "#FFC40C"} } className="glyphicon glyphicon-star"></span>;
    }
    return (
      <Activity name={this.props.name} avatar={this.props.avatar} key={this.props.page.id}>
        {joinLink}
        <a target="_blank" className="current-location" href={this.props.page.url}>{title}</a>
        {star}
      </Activity>
    );
  }
});
UI.PageVisit = PageVisit;

/* When a person joins */
var Join = React.createClass({
  render: function () {
    return (
      <Activity name={this.props.name} avatar={this.props.avatar} key={this.props.key}>
        <Timestamp time={this.props.time} pullRight={false} />
        <h4 className="media-heading username">{this.props.name}</h4>
        Joined the session.
      </Activity>
    );
  }
});
UI.Join = Join;

var Invited = React.createClass({
  render: function () {
    var invitees = "";
    for (var i=0; i<this.props.invitees.length; i++) {
      if (invitees) {
        invitees += ", ";
      }
      invitees += this.props.invitees[i];
    }
    if (this.props.invitees.length > 1) {
      invitees += " and " + this.props.invitees[this.props.invitees.length-1];
    }
    return (
      <Activity name={this.props.name} avatar={this.props.avatar} key={this.props.key}>
        <Timestamp time={this.props.time} pullRight={true} />
        <h4 className="media-heading username">{this.props.name}</h4>
        invited {invitees} to the session.
      </Activity>
    );
  }
});
UI.Invited = Invited;

/* When a person joins a page in presentation mode */
var JoinedMirror = React.createClass({
  render: function () {
    return (
      <Activity name={this.props.name} avatar={this.props.avatar} key={this.props.key}>
        <Timestamp time={this.props.time} pullRight={true} />
        <h4 className="media-heading username">{this.props.name}</h4>
        Joined you at <span>{this.props.tab.current().url}</span>
      </Activity>
    );
  }
});
UI.JoinedMirror = JoinedMirror;

/* When there is a chat */
var Chat = React.createClass({
  render: function () {
    return (
      <Activity name={this.props.name} avatar={this.props.avatar} key={this.props.key}>
        <Timestamp time={this.props.time} pullRight={true} />
        <h4 className="media-heading username">{this.props.name}</h4>
        <div style={ {"white-space": "pre-wrap"} }>
          <i >&quot;{this.props.text}&quot;</i>
        </div>
      </Activity>
    );
  }
});
UI.Chat = Chat;

var ActivityList = React.createClass({
  getInitialState: function () {
    return {};
  },
  render: function () {
    var activities = this.state.activities || [];
    return (
      <div className="activity-stream">
        <div className="row">
          <div>
            <ul className="media-list">
              {activities}
            </ul>
          </div>
        </div>
      </div>
    );
  }
});
UI.ActivityList = ActivityList;

var ChatField = UI.ChatField = React.createClass({
  handleSubmit: function (event) {
    event.preventDefault();
    var node = this.refs.text.getDOMNode();
    var text = node.value;
    node.value = "";
    if (text) {
      this.props.onChatSubmit(text);
    }
  },
  render: function () {
    return (
      <div id="chat-field">
        <form className="input-group input-group" onSubmit={this.handleSubmit}>
          <input id="chat" type="text" className="form-control" ref="text" placeholder="Type here to chat to the group" />
          <span className="input-group-btn">
            <button className="btn btn-default" type="submit">Send</button>
          </span>
        </form>
      </div>
    );
  }
});

var ShareDropDown = React.createClass({
  componentDidMount: function() {
    $(this.refs.button.getDOMNode()).dropdown();
  },
  render: function () {
    var users = [];
    this.props.peers.forEach(function (peerInfo) {
      users.push(
        <li key={peerInfo.peer.id}>
          <a href="#" className="share-peer" data-peer-id={peerInfo.peer.id}>
            <span className="glyphicon glyphicon-ok" style={ {opacity: peerInfo.sharing ? "1" : "0"} }></span>
            {peerInfo.peer.name}
          </a>
        </li>
      );
    });
    if (this.props.all) {
      users.push(
        <li key="all"><a href="#" className="share-peer">All</a></li>
      );
    }
    return (
      <div>
        <button ref="button" type="button" data-toggle="dropdown" className="btn btn-default dropdown-toggle">
          Share <span className="caret"></span>
        </button>
        <ul className="dropdown-menu" role="menu">
          {users}
        </ul>
      </div>
    );
  }
});

// We can't do the handler directly because Bootstrap seems to be
// moving elements around for its dropdown.  So instead we just bind
// them globally thusly:

/* as implemented, this breaks links in the activity stream #216
$(document).bind("click", ".share-peer", function (event) {
  var el = $(event.target).closest(".share-peer");
  event.preventDefault();
  UI.events.emit("shareToPeer", el.attr("data-peer-id"));
});
*/

var Bar = UI.Bar = React.createClass({
  getInitialState: function () {
    return {presenting: false, peers: []};
  },

  onPresentClick: function () {
    this.props.onPresentClick();
    return false;
  },

  onShareClick: function () {
    UI.events.emit("shareToPeer", null);
    return false;
  },

  onOpenNotesClick: function () {
    UI.events.emit("openNotes", null);
    return false;
  },

  render: function () {
    var presentingText = "";
    var presentingTitle = "Present this page";
    var buttonClass = "btn btn-default btn-lg";
    var presentingClass = buttonClass;
    if (this.state.presenting) {
      presentingText = " Presenting";
      presentingClass += " active btn-success btn-currently-presenting";
      presentingTitle = "Click to stop presenting";
    } else if (this.state.viewing) {
      presentingText = " Viewing";
      presentingClass += " active btn-warning";
      presentingTitle = "You are viewing; close the tab to end";
    }
    var userList = [];
    this.state.peers.forEach(function (peerInfo) {
      userList.push(
        <li key={peerInfo.peer.id}>
          <a href="#" className="share-peer" data-peer-id={peerInfo.peer.id}>
            <span className="glyphicon glyphicon-ok" style={ {opacity: peerInfo.sharing ? "1" : "0"} }></span>
            {peerInfo.peer.name}
          </a>
        </li>
      );
    });
    return (
      /* justified is really hard to get working here! */
      <div className="middlebar" className="" className="handstyled btn-group btn-group-justified" style={ {margin:"0px", border:"0px", backgroundColor: "#EEE"} }>
        <div className="btn-group" style={ {display:"table-cell", float:"none"} }>
          <Tooltip>
            <button type="button" className={"handstyled " + buttonClass}
              title="Share this page with everyone"
              style={ {borderRadius: "0px"} }
              onClick={this.onShareClick}>
              <span className="glyphicon glyphicon-export"></span>
            </button>
          </Tooltip>
          <div style={ {display: "none"} }>
          <Dropdown>
            <Tooltip>
              <button type="button" className={"handstyled " + buttonClass}
                title="Share with someone specific"
                style={ {borderRadius: "0px"} }>
                <span className="caret"></span>
                <span className="sr-only">Toggle Dropdown</span>
              </button>
            </Tooltip>
            <ul className="dropdown-menu" role="menu">
              {userList}
            </ul>
          </Dropdown>
          </div>
        </div>
        <div className="btn-group" style={ {display:"table-cell", float:"none"} }>
          <Tooltip>
            <button type="button" className={buttonClass}
              title="Imaginary uploading">
              <span className="glyphicon glyphicon-cloud-upload"></span>
            </button>
          </Tooltip>
        </div>
        <div className="btn-group" style={ {display:"table-cell", float:"none"} }>
          <Tooltip>
            <button type="button" className={buttonClass}
              title=""
              onClick={this.onOpenNotesClick}>
              <span className="glyphicon glyphicon-dashboard"></span>
            </button>
          </Tooltip>
        </div>
        <div className="btn-group" style={ {display:"table-cell", float:"none"} }>
          <Tooltip>
            <button id="btn-presenting" type="button" className={"handstyled " + presentingClass}
              style={{paddingRight: "4px", paddingLeft: "4px", borderRadius:"0px"}}
              title={presentingTitle}
              onClick={this.onPresentClick}>
              <img src="assets/presenter.png" width="44" height="27" style={{padding:"0 6px 0 0"}} />
              {presentingText}
            </button>
          </Tooltip>
        </div>
        /*
        <div className="row text-center">
           <div className="col-xs-8 drowdownrow">
              <ShareDropDown peers={this.state.peers} all="1" onShare={this.props.onShare} />
           </div>
           <div className="col-xs-4 presentrow">
             <button className={presentingClass} id="btn-presenting" type="button" onClick={this.onPresentClick}>{presentingText}</button>
           </div>
        </div>
        */
      </div>
    );
  }
});

var UserSelect = React.createClass({
  onChange: function () {
    var value = this.getDOMNode().value;
    this.getDOMNode().selectedIndex = 0;
    this.props.onSelect(value);
  },
  render: function () {
    var options = [];
    this.props.peers.forEach(function (p) {
      options.push(
        <option value={p.id} key={p.id}>
          <input type="checkbox" />
          <img src={p.avatar} style={ {height: "1em", width: "1em"} } />
          {p.name}
        </option>
        // <option>
        //   <input type="checkbox" />
        //   All
        // </option>
      );
    });
    return (
      <select onChange={this.onChange}>
        <option key="blank">{this.props.children}</option>
        {options}
      </select>
    );
  }
});

// Private Messages list
var PrivateMsgsList = UI.PrivateMsgsList = React.createClass({
  getInitialState: function () {
    return {};
  },
  render: function () {
    var privatemsgs = this.state.privatemsgs || [];
    return (
      <div className="activity-stream" id="private-messages-list">
        <div className="row">
          <div className="">
            <ul className="media-list">
              <li className="media">
                <a className="pull-left" href="#">
                  <div className="sm-avatar">
                    <img className="media-object user-avatar" src="" alt="" />
                  </div>
                </a>
                <div className="media-body">
                  <span className="timestamp pull-right" href="#">13 mins ago</span>
                  <h4 className="media-heading username">Gregg</h4>
                  "Ok that sounds good!"
                </div>
                <span className="glyphicon glyphicon-chevron-right pull-right chevron-icon"></span>
              </li>
              <li className="media">
                <a className="pull-left" href="#">
                  <div className="sm-avatar">
                    <img className="media-object user-avatar" src="" alt="" />
                  </div>
                </a>
                <div className="media-body">
                  <span className="timestamp pull-right" href="#">2 mins ago</span>
                  <h4 className="media-heading username">Ian</h4>
                  "What is this about?"
                </div>
                <span className="glyphicon glyphicon-chevron-right pull-right chevron-icon"></span>
              </li>
              <li className="media">
                <a className="pull-left" href="#">
                  <div className="sm-avatar">
                    <img className="media-object user-avatar" src="" alt="" />
                  </div>
                </a>
                <div className="media-body">
                  <span className="timestamp pull-right" href="#">5 mins ago</span>
                  <h4 className="media-heading username">Ilana</h4>
                  "Yeah I think I saw that page already."
                </div>
                <span className="glyphicon glyphicon-chevron-right pull-right chevron-icon"></span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
});




})();
