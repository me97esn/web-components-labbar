  (function() {
    'use strict';

    Polymer({
      is: 'join-or-list-battles',
    created() {
      System.import('scripts/settings.js')
        .then(settings => fetch(`${settings.restApi}/user/${localStorage.userName}/battles`))      
        .then(res => res.json())
        .then(res => {
          console.log('TODO: check if the user is in a battle', res);
        })
        .catch(e => console.error(e))
      location.hash = `/battles`;
    },
      properties: {}
    });
  })();