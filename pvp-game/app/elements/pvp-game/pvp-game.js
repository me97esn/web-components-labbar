(function() {
  'use strict';

  Polymer({
    is: 'pvp-game',
    ready() {
      this.tokenAndAuthenticated = false;
      this.token = localStorage.token || null;
      if (!this.token) {
        this.createUser();
      }
      if (!location.hash) {
        location.hash = '/';
      }

      System.import('/scripts/socket.js')
        .then(socket => {
          socket.emit('authenticate', {
            token: localStorage.token
          });
          socket.on('userId', _userId => {
            socket.userId = _userId;
            this.tokenAndAuthenticated = this.token && socket.userId;
          });
        })

      this.route = function(hash) {
        return function() {
          this.hash = {
            [hash]: hash, arguments
          }
        }.bind(this)
      };

      const routes = {
        '/': this.route('root'),
        '/battles': this.route('battles'),
        '/battle/:battleId': function(id) {
          this.hash = {
            battle: 'battle'
          };
          this.battleId = id;
        }.bind(this)
      };

      const router = Router(routes);

      router.init();
    },
    properties: {
      foo: {
        type: String,
        value: 'pvp-game',
        notify: true
      }
    },
    createUser() {
      console.log('creating user')
      System.import('scripts/settings.js')
        .then(settings => fetch(`${settings.restApi}/user`, {
          method: 'post',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: ''
        }))
        .then(res => res.json())
        .then(res => {
          this.token = localStorage.token = res;
        })
        .catch(e => console.error(e))
    },

  });
})();