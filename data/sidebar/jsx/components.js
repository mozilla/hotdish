/** @jsx React.DOM */
/* These are the React components we are using */

(function () {

var UI = window.UI = {};

UI.events = mixinEvents({});

var DynamicMixin = {
  /* This function will be called with a DOM node that has just been
     created, and you can enable any Bootstrap (or other) widgety things
     through this. */
  componentDidMount: function (rootNode) {
    $("*[data-toggle=tooltip]", rootNode).tooltip();
  }
};

/* This is the avatar of yourself in the header */
var SelfAvatar = UI.SelfAvatar = React.createClass({
  render: function () {
    return (
      <div className="wrapper">
        <div className="main" style={ {background: "url(" + this.props.avatar + ")"} }>
          <div className="username">
            me
          </div>
          <div className="overlay">
            <div className="row">
              <div className="container text-center">
                <div className="col-xs-12">
                  <a href="#" className="btn btn-default btn-sm" role="button">
                    Take photo
                  </a>
                  <a href="#" className="btn btn-default btn-sm" role="button">
                    Settings
                  </a>
                  <a href="#" className="btn btn-default btn-sm" role="button">
                    Profile
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

/* This is the big invite button */
var InviteAvatar = UI.InviteAvatar = React.createClass({
  render: function () {
    return (
      <div className="wrapper">
        <div className="main">
          <div className="row">
            <div className="col-xs-12 text-center inviteNewperson">
              <button type="button" className="btn btn-default btn-sm">
                <span className="glyphicon glyphicon-plus-sign"></span> Invite
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

/* And then a blank space */
var BlankAvatar = UI.BlankAvatar = React.createClass({
  render: function () {
    return (
      <div className="wrapper">
        <div className="main">
          <div className="overlay">
            <div className="row">
            </div>
          </div>
        </div>
      </div>
    );
  }
});


/* This is the avatar of anyone else */
var PeerAvatar = UI.PeerAvatar = React.createClass({
  render: function () {
    return (
      <div className="wrapper">
        <div className="main" style={ {background: "url(" + this.props.avatar + "}"} }>
          <div className="username">
            {this.props.name}
          </div>
          <div className="overlay">
            <div className="row">
              <div className="container text-center">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});



var UserGrid = UI.UserGrid = React.createClass({
  mixins: [DynamicMixin],
  getInitialState: function () {
    return {};
  },
  render: function () {
    var children = this.state.users || [];
    if (children.length < 4) {
      children.push(<InviteAvatar />);
    }
    while (children.length < 4) {
      children.push(<BlankAvatar />);
    }
    return (
      <div id="users">
        <div className="row">
          {children[0]}
          {children[1]}
        </div>
        <div className="row">
          {children[2]}
          {children[3]}
        </div>
      </div>
    );
  }
});

var Activity = UI.Activity = React.createClass({
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

/* This is a page visit activity */
var PageVisit = UI.PageVisit = React.createClass({
  clickSpectate: function () {
    UI.events.emit("spectate", this.props.page);
    return false;
  },
  render: function () {
    var joinLink = null;
    if (! this.props.page.tab.peer.isSelf) {
      joinLink = <a className="glyphicon glyphicon-eye-open pull-right spectate-page" href="#" title="Spectate on their page" data-toggle="tooltip" data-placement="left" onClick={this.clickSpectate}></a>;
    }
    return (
      <Activity name={this.props.name} avatar={this.props.avatar} key={this.props.page.id}>
        {joinLink}
        <h4 className="media-heading username">{this.props.name}</h4>
        is currently on <a target="_blank" className="current-location" href={this.props.page.url}>{this.props.page.title}</a>
      </Activity>
    );
  }
});

/* When a person joins */
var Join = UI.Join = React.createClass({
  render: function () {
    return (
      <Activity name={this.props.name} avatar={this.props.avatar} key={this.props.key}>
        <span className="timestamp pull-right" href="#">{this.props.time}</span>
        <h4 className="media-heading username">{this.props.name}</h4>
        joined the session.
      </Activity>
    );
  }
});

/* When there is a chat */
var Chat = UI.Chat = React.createClass({
  render: function () {
    return (
      <Activity name={this.props.name} avatar={this.props.avatar} key={this.props.key}>
        <span className="timestamp pull-right" href="#">{this.props.time}</span>
        <h4 className="media-heading username">{this.props.name}</h4>
        {this.props.text}
      </Activity>
    );
  }
});

var ActivityList = UI.ActivityList = React.createClass({
  mixins: [DynamicMixin],
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
