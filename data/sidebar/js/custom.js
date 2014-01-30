    //tooltips
    // FIXME: move to components.js
    $('.spectate-page').tooltip();
    $('.push-page').tooltip();

    // fade out username
    $('.user-one').hover(function(){
      $('.user-one .username').fadeOut();
    }, function(){
      $('.user-one .username').fadeIn();
    })
    $('.user-two').hover(function(){
      $('.user-two .username').fadeOut();
    }, function(){
      $('.user-two .username').fadeIn();
    })
    $('.user-three').hover(function(){
      $('.user-three .username').fadeOut();
    }, function(){
      $('.user-three .username').fadeIn();
    })
    $('.user-four').hover(function(){
      $('.user-four .username').fadeOut();
    }, function(){
      $('.user-four .username').fadeIn();
    })

    //tabbable activity list area
    $("#private-messages-list").hide();
    $('.btn-activity-stream').click(function(){
      $("#chat-field").show();
      $("#activity-list").show();
      $("#private-messages-list").hide();
      $('.middlebar li:first-child').addClass('active');
      $('.middlebar li:nth-child(2)').removeClass('active');
    });

    //$('.btn-private-messages').click(function(){
      //alert("test");
      //$("#activity-stream-container").hide();
      //$("#chat-field").hide();
      //$("#private-messages-list").show();
      //$('.middlebar li:nth-child(2)').addClass('active');
      //$('.middlebar li:first-child').removeClass('active');
    //});

    //toggle Activity View and Participant View
    $("#participant-view .user-one-participant-view").hide();

    //Updating the Activity Window dynamically.
    $(function(){
      //$('.switch').css({'height': (($(window).height())-300)+'px'});

      //$(".switch").width(width);

      $(window).resize(function(){
          //$('.switch').css({'height': (($(window).height())-300)+'px'});
          //var width = $(window).width() - 25;
      });
    });

    //adding style for when all users have joined a HotDish session
    $(function(){
      $(".btn-activity-stream").click(function(){
        notificationDropDown();
        //$(".all-users-here-notification").fadeIn(100).fadeOut(2000);
        addon.port.emit("notifyEveryoneHere");
      });
    });

    function notificationDropDown() {
      $(".all-users-here-notification").animate({
        "top": "+=33px"
      }, 500).delay(4000);
      $(".all-users-here-notification").animate({
        "top": "-=33px"
      }, 500);
    }

    function notificationDropDownInvites() {
      $(".invites-sent-notification").animate({
        "top": "+=33px"
      }, 500).delay(4000);
      $(".invites-sent-notification").animate({
        "top": "-=33px"
      }, 500);
    }

    function inviteSent() {
      notificationDropDownInvites();
      var names = [];
      $("input[name='invitee']:checked").each(function () {
        names.push(this.value);
      });
      addon.port.emit("sendInvitations", names);
    }

    // show hide invitation panel
    $(function(){
      $(".btn-invite-ppl").click(function(){
        //alert();
      });
    });
