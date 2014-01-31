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

var AvatarBlankWrapper = React.createClass({
  render: function () {
    var style = {};
    if (this.props.backgroundImage) {
      style.background = "url(" + this.props.backgroundImage + ")";
      style.backgroundRepeat = "no-repeat";
      style.backgroundSize = "100% 100%";
    }
    return (
      <div className="wrapper" key={this.props.key}>
        <div className="main" style={ style }>
          {this.props.children}
        </div>
      </div>
    );
  }
});

var AvatarWrapper = React.createClass({
  render: function () {
    return (
      <AvatarBlankWrapper backgroundImage={this.props.avatar} key={this.props.key}>
        <div className="username">
          {this.props.username}
        </div>
        <div className="overlay">
          <div className="row">
            <div className="container text-center">
              {this.props.children}
            </div>
          </div>
        </div>
      </AvatarBlankWrapper>
    );
  }
});

/* This is the avatar of yourself in the header */
var SelfAvatar = UI.SelfAvatar = React.createClass({
  render: function () {
    return (
      <AvatarWrapper avatar={this.props.avatar} username="me">
        <a href="#" className="btn btn-default btn-sm" role="button">
          Take photo
        </a>
        <a href="#" className="btn btn-default btn-sm" role="button">
          Settings
        </a>
        <a href="#" className="btn btn-default btn-sm" role="button">
          Profile
        </a>
      </AvatarWrapper>
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
    var inviteOrWait = null;
    var inviteOrWait = this.props.waiting ? <WaitingForUser /> : <InviteUser /> ;
    var waiting = this.props.waiting ? <WaitingForUser /> : null;
    return (
      <AvatarBlankWrapper key={this.props.key}>
        <div className="row">
          <div className="col-xs-12 text-center inviteNewperson"  style={{backgroundColor:bgcolor}}>
            {inviteOrWait}
          </div>
        </div>
      </AvatarBlankWrapper>
    );
  }
});

/* And then a blank space */
var BlankAvatar = UI.BlankAvatar = React.createClass({
  render: function () {
    var waiting = this.props.waiting ? <WaitingForUser /> : null;
    return (
      <AvatarBlankWrapper key={this.props.key}>
        <div className="overlay">
          <div className="row">
            No one is here yet.
            {waiting}
          </div>
        </div>
      </AvatarBlankWrapper>
    );
  }
});

var InviteUser = React.createClass({
  clickInvite: function () {
    UI.events.emit("invite");
    return false;
  },
  render: function () {
    return (
      <div className="invitePlusbtn" style={{fontSize: "50", cursor: "pointer"}} onClick={this.clickInvite}>+</div>
    )
  }
});


var WaitingForUser = React.createClass({
  render: function () {
    return (
      <span className="waitingforuser" style={ {background: "url(assets/avatar.png) no-repeat center center", backgroundSize: "64px 64px", position: "absolute", top: "4px", left: "0px", padding: "6px", width: "100%", height: "100%"} }>
        Waiting for person...
      </span>
    );
  }
});


/* This is the avatar of anyone else */
var PeerAvatar = UI.PeerAvatar = React.createClass({
  render: function () {
    return (
      <AvatarWrapper avatar={this.props.avatar} key={this.props.key}
                     username={this.props.name}>
        <div className="col-xs-12">
          <a href="" className="btn btn-default btn-sm" role="button">
            Talk
          </a>
          <a href="" className="btn btn-default btn-sm" role="button">
            Profile
          </a>
          <a href="" className="btn btn-default btn-sm" role="button">
            Invite
          </a>
        </div>
      </AvatarWrapper>
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

    /* if (children.length < 4) {
      children.push(<InviteAvatar key="invite" waiting={!! numberToWaitFor} />);
      if (numberToWaitFor > 0) {
        numberToWaitFor--;
      }
    }*/
    var blankId = 0;
    while (children.length < 4) {
      blankId++;
      var waiting = false;
      if (numberToWaitFor > 0) {
        waiting = true;
        numberToWaitFor--;
      }
      console.log("waiting:",waiting);
      children.push(<InviteAvatar key={ 'blank' + blankId } n={blankId} waiting={waiting} />);
    }
    return (
      <div id="users">
        <div className="all-users-here-notification">Yay, everyone is here!</div>
        <div className="invites-sent-notification">Invites sent!</div>
        <div className="row firstUserRow">
          {children[0]}
          {children[1]}
        </div>
        <div className="row secondUserRow">
          {children[2]}
          {children[3]}
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
  componentDidMount: function() {
    $(this.getDOMNode()).tooltip();
  },
  render: function () {
    return this.props.children;
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
    return (
      <Activity name={this.props.name} avatar={this.props.avatar} key={this.props.page.id}>
        {joinLink}
        <a target="_blank" className="current-location" href={this.props.page.url}>{this.props.page.title}</a>
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
          <a href="#">
            <span className="glyphicon glyphicon-ok" style={ {opacity: peerInfo.sharing ? "1" : "0"} }></span>
            {peerInfo.peer.name}
          </a>
        </li>
      );
    });
    if (this.props.all) {
      users.push(
        <li key="all"><a href="#">All</a></li>
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

var Bar = UI.Bar = React.createClass({
  getInitialState: function () {
    return {presenting: false, peers: []};
  },
  onPresentClick: function () {
    var presenting = ! this.state.presenting;
    this.setState({presenting: presenting});
    this.props.onPresentClick(presenting);
    return false;
  },
  onPresentSelect: function (id) {
    if (! this.state.presenting) {
      this.setState({presenting: true});
    }
    this.props.onPresentSelect(id);
    return false;
  },
  onActivityClick: function () {
    this.props.onActivityClick();
    return false;
  },
  onPushClick: function () {
    this.props.onPushClick();
    return false;
  },
  onPushSelect: function (id) {
    this.props.onPushSelect(id);
    return false;
  },
  render: function () {
    var buttonText = "Present on page";
    var buttonClass = "btn btn-default btn-primary btn-xs";
    if (this.state.presenting) {
      buttonText = "Presenting...";
      buttonClass += " active btn-success";
    }
    return (
      <div className="middlebar">
        <div className="row text-center">
           <div className="col-xs-8 drowdownrow">
              <ShareDropDown peers={this.state.peers} all="1" onSelect={this.props.onPushSelect} />
           </div>
           <div className="col-xs-4 presentrow">
             <button className={buttonClass} id="btn-presenting" type="button" onClick={this.onPushClick}>{buttonText}</button>
           </div>
        </div>
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
