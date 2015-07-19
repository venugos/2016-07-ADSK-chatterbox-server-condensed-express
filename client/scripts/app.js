var app;
$(function() {
  var busy = {};
  var rooms = {};

  app = {
    server: 'http://localhost:3000/classes/messages',
    username: 'anonymous',
    roomname: '',
    lastMessageId: 0,
    friends: {},

    init: function() {
      // Get username
      app.username = window.location.search.substr(10);

      // Cache jQuery selectors
      app.$main = $('#main');
      app.$message = $('#message');
      app.$chats = $('#chats');
      app.$roomSelect = $('#roomSelect');
      app.$send = $('#send');

      // Add listeners
      app.$main.on('click', '.username', app.addFriend);
      app.$send.on('submit', app.handleSubmit);
      app.$roomSelect.on('change', app.saveRoom);

      // Set current room
      app.$roomSelect.val(app.roomname);

      // Fetch previous messages
      app.fetch(false);

      // Poll for new messages
      setInterval(app.fetch, 3000);
    },
    send: function(data) {
      // Clear messages input
      app.$message.val('');

      // Start the spinner for the send action
      app.startSpinner('send');

      // POST the message to the server
      $.ajax({
        url: app.server,
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function (data) {
          console.log('chatterbox: Message sent');
          // Trigger a fetch to update the messages, pass true to animate
          app.fetch(true);
        },
        error: function (data) {
          console.error('chatterbox: Failed to send message');
        },
        complete: function () {
          app.stopSpinner('send');
        }
      });
    },
    fetch: function(animate) {
      app.startSpinner('fetch');

      $.ajax({
        url: app.server,
        type: 'GET',
        contentType: 'application/json',
        data: { order: '-createdAt'},
        success: function(data) {
          console.log('chatterbox: Messages fetched');

          // Don't bother if we have nothing to work with
          if (!data.results || !data.results.length) { return; }

          // Get the last message
          var mostRecentMessage = data.results[data.results.length-1];
          var displayedRoom = $('.chat span').first().data('roomname');

          // Only bother updating the DOM if we have a new message
          if (mostRecentMessage.objectId !== app.lastMessageId || app.roomname !== displayedRoom) {
            // Update the UI with the fetched rooms
            app.populateRooms(data.results);

            // Update the UI with the fetched messages
            app.populateMessages(data.results, animate);

            // Store the ID of the most recent message
            app.lastMessageId = mostRecentMessage.objectId;
          }
        },
        error: function(data) {
          console.error('chatterbox: Failed to fetch messages');
        },
        complete: function() {
          app.stopSpinner('fetch');
        }
      });
    },
    clearMessages: function() {
      app.$chats.html('');
    },
    populateMessages: function(results, animate) {
      // Clear existing messages
      app.clearMessages();

      if (Array.isArray(results)) {
        // Add all fetched messages
        results.forEach(app.addMessage);
      }

      // Make it scroll to the bottom
      var scrollTop = app.$chats.prop('scrollHeight');
      if (animate) {
        app.$chats.animate({
          scrollTop: scrollTop
        });
      }
      else {
        app.$chats.scrollTop(scrollTop);
      }
    },
    populateRooms: function(results) {
      if (results) {
        results.forEach(function(data) {
          var roomname = data.roomname;
          app.addRoom(roomname);
        });
      }
    },
    addRoom: function(roomname) {
      if( !roomname || rooms[roomname] ) {
        return;
      }

      // Store rooms currently tracked
      rooms[roomname] = true;

      // Prevent XSS by escaping with DOM methods
      var $option = $('<option/>').val(roomname).text(roomname);

      // Add to select
      app.$roomSelect.append($option);
    },
    addMessage: function(data) {
      // Only add messages that are in our current room
      if (data.roomname === app.roomname) {
        // Create a div to hold the chats
        var $chat = $('<div class="chat"/>');

        // Add in the message data using DOM methods to avoid XSS
        // Store the username in the element's data
        var $username = $('<span class="username"/>');
        $username.text(data.username+': ').attr('data-username', data.username).attr('data-roomname',data.roomname).appendTo($chat);

        // Add the friend class
        if (app.friends[data.username] === true)
          $username.addClass('friend');

        var $message = $('<br><span/>');
        $message.text(data.text).appendTo($chat);

        // Add the message to the UI
        app.$chats.append($chat);
      }
    },
    addFriend: function(evt) {
      var username = $(evt.currentTarget).attr('data-username');

      if (username !== undefined) {
        console.log('chatterbox: Adding %s as a friend', username);

        // Store as a friend
        app.friends[username] = true;

        // Bold all previous messages
        // Escape the username in case it contains a quote
        var selector = '[data-username="'+username.replace(/"/g, '\\\"')+'"]';
        var $usernames = $(selector).addClass('friend');
      }
    },
    saveRoom: function(evt) {

      var selectIndex = app.$roomSelect.prop('selectedIndex');
      // New room is always the first option
      if (selectIndex === 0) {
        var roomname = prompt('Enter room name');
        if (roomname) {
          // Set as the current room
          app.roomname = roomname;

          // Add the room to the menu
          app.addRoom(roomname);

          // Select the menu option
          app.$roomSelect.val(roomname);

          // Fetch messages again
          app.fetch();
        }
      }
      else {
        // Store as undefined for empty names
        app.roomname = app.$roomSelect.val();

        // Fetch messages again
        app.fetch();
      }
    },
    handleSubmit: function(evt) {
      var message = {
        username: app.username,
        text: app.$message.val(),
        roomname: app.roomname
      };

      app.send(message);

      // Stop the form from submitting
      evt.preventDefault();
    },
    startSpinner: function(task) {
      task = task || 'default';
      busy[task] = true;

      $('.spinner img').show();
      $('form input[type=submit]').attr('disabled', "true");
    },

    stopSpinner: function(task) {
      var stillBusy = false;
      var k;

      task = task || 'default';
      busy[task] = false;

      // Check if any other tasks are still busy
      for( k in busy ) {
        if( busy[k] ) {
          stillBusy = true;
        }
      }

      // If no tasks are busy, stop the spinner
      if( !stillBusy ) {
        $('.spinner img').fadeOut('fast');
        $('form input[type=submit]').attr('disabled', null);
      }
    }
  };
}());
