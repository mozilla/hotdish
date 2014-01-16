/** @jsx React.DOM */
/* These are the React components we are using */

(function () {

var UI = window.UI = {};

/* This is the avatar of yourself in the header */
var SelfAvatar = UI.SelfAvatar = React.createClass({
  render: function () {
    return (
      <div className="wrapper">
        <div className="main" style={ {background: "url(" + this.props.avatar + ")"} }>
          <div className="overlay">
            <div className="row">
              <div className="container text-center">
                <div className="col-xs-4">
                  <span className="glyphicon glyphicon-minus-sign"></span>
                  <br/>Mute
                </div>
                <div className="col-xs-4">
                  <span className="glyphicon glyphicon-camera"></span>
                  <br/>Take photo
                </div>
                <div className="col-xs-4">
                  <span className="glyphicon glyphicon-cog"></span>
                  <br/>Settings
                </div>
              </div>
            </div>
            <div className="username">
              me
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
          <div className="overlay">
            <div className="row">
              +
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
          <div className="overlay">
            <div className="row">
              <div className="container text-center">
                <div className="col-xs-4">
                  <span className="glyphicon glyphicon-minus-sign" title="Mute"></span>
                  <br/>Mute
                </div>
                <div className="col-xs-4">
                  <span className="glyphicon glyphicon-comment"></span>
                  <br/>Talk
                </div>
                <div className="col-xs-4">
                  <span className="glyphicon glyphicon-user"></span>
                  <br/>Profile
                </div>
                <div className="col-xs-4">
                  <span className="glyphicon glyphicon-plus-sign"></span>
                  <br/>Buddy Up
                </div>
              </div>
            </div>
            <div className="username">
              {this.props.name}
            </div>
          </div>
        </div>
      </div>
    );
  }
});



var UserGrid = UI.UserGrid = React.createClass({
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
      <li>
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
  render: function () {
    return (
      <Activity name={this.props.name} avatar={this.props.avatar}>
        <a className="glyphicon glyphicon-eye-open pull-right" href="#" title="Join this page"></a>
        <h4 className="media-heading username">{this.props.name}</h4>
        is currently on <a className="current-location" href={this.props.url}>{this.props.title}</a>
      </Activity>
    );
  }
});

/* When a person joins */
var Join = UI.Join = React.createClass({
  render: function () {
    return (
      <Activity name={this.props.name} avatar={this.props.avatar}>
        <span className="timestamp pull-right" href="#">{this.props.time}</span>
        <h4 className="media-heading username">{this.props.name}</h4>
        joined
      </Activity>
    );
  }
});

/* When there is a chat */
var Chat = UI.Chat = React.createClass({
  render: function () {
    return (
      <Activity name={this.props.name} avatar={this.props.avatar}>
        <span className="timestamp pull-right" href="#">{this.props.time}</span>
        <h4 className="media-heading username">{this.props.name}</h4>
        {this.props.text}
      </Activity>
    );
  }
});

var ActivityList = UI.ActivityList = React.createClass({
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
        <form className="input-group input-group">
          <input id="chat" type="text" className="form-control" ref="text" placeholder="Type here to chat" />
          <span className="input-group-btn">
            <button className="btn btn-default" type="button">Send</button>
          </span>
        </form>
      </div>
    );
  }
});



})();
