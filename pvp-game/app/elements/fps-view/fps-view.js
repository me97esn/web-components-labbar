  (function() {
    'use strict';

    Polymer({
      is: 'fps-view',
      battleChanged(battle) {
        System.import('scripts/fps.js')
        .then(fps => fps.battleChanged(battle));
      },
      properties: {
        battle: {
          type: Object,
          observer: 'battleChanged'
        }
      },
      listeners: {
        'tap': 'shoot'
      },
      _isNotMe: function(user) {
        return this.socket && this.socket.userId !== user.id;
      },
      shoot() {
        System.import('scripts/fps.js')
          .then(fps => {
            fps.explosion.visible = true;
            return fps
          })
          .then(fps => setTimeout(() => fps.explosion.visible = false, 100))

        System.import('scripts/socket.js')
          .then(socket => {
            socket.emit('shoot', {
              heading: this.heading
            });

          })
          .catch(e => console.error(e))
        console.log('┌( ͝° ͜ʖ͡°)=ε/̵͇̿̿/’̿’̿ ̿');
      },

      created() {
        // System.import('scripts/socket.js')
        //   .then(socket => {
        //     this.socket = socket;

        //     socket.on('battlesChanged', data => {
        //       this.battle = data;
        //       this.users = Object.keys(data.users).map(key => data.users[key]);;

        //     })
        //   })

        // // render the scene
        System.import('scripts/fps.js').then(fps => fps.init());
      }
    });
  })();