(function() {
  'use strict';

  Polymer({
    is: 'pvp-battle',
    attributeChanged() {
      System.import('scripts/socket.js')
        .then(socket => {

          socket.on('battlesChanged', battle => {
            this.battle = battle
          })

          socket.on('userChanged', newUser => {
            console.log('user changed')
            this.battle.users = this.battle.users.map(oldUser => {
              if (newUser.id === oldUser.id) {
                return newUser;
              } else {
                return oldUser;
              };
            });
          })

          socket.emit('joinBattle', this.attributes.id.value);

          navigator.geolocation.watchPosition(pos => {
            const location = {
              coords: {
                latitude: pos.coords.latitude,
                altitude: pos.coords.altitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy
              }
            }
            socket.emit('location', {
              location
            });
          });
        })
        .catch(e => console.error(e))
    },
    properties: {
      id: String
    }
  });
})();