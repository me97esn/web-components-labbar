
  (function() {
    'use strict';

  Polymer({
    is: 'shoot-battles',
    
    joinBattle( evt ){
      location.href = `/#/battle/${evt.target.dataItem.id}`
    },

    formatTimes(){
      console.log('format times');
      this.battles.forEach(battle => {battle._battleEnds = moment(battle.battleEnds).fromNow()})
    },

    _collapseExpand: function(e) {
      // debugger
      var list = this.$$('#list');
      var index = e.model.index;
      var isExpanded = list.items[index].expanded;
      list.set('items.' + index + '.expanded', !isExpanded);
      list.updateSizeForItem(e.model.index);
    },

    iconForItem: function(item) {
      return item ? (item.integer < 50 ? 'star-border' : 'star') : '';
    },

    getClassForItem: function(item, expanded) {
      return expanded ? 'item expanded' : 'item';
    },

    hideNewBattle() {
      this.showNewBattle = false;
    },

    newBattle() {
      this.showNewBattle = true;
      this.showPage = 0;
    },

    new3minBattle() {
      this._createBattle();
    },
    _createBattle(battleEnds){
      battleEnds = battleEnds || moment().add(3, 'minutes').toDate();
      let battleId;
      System.import('scripts/settings.js')
        .then(settings => fetch(`${settings.restApi}/battle`, {
          method: 'post',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            battleEnds
          })
        }))
        .then(res => res.json())
        .catch(e => console.error(e))
    },
    ready: function() {
      System.import('scripts/settings.js')
        .then(settings => {this.restApi = settings.restApi});

      this.addEventListener('date-selected', evt => {
          this.selectedDate = evt.target.date;
          this.showPage = 1
        });

      this.addEventListener('value-changed', evt => {
        this.selectedTime = evt.target.value;
        this.showNewBattle = false;
        const ends = moment(`${this.selectedDate.year} ${this.selectedDate.month} ${this.selectedDate.day} ${this.selectedTime}`).toDate();
        this._createBattle(ends);
      });

      this.showNewBattle = false;
      this.userName = localStorage.userName || null;
      System.import('scripts/socket.js')
      .then(socket=>{
        socket.on('newBattle', data => {
          console.log('new battle received', data);
                this.battles.unshift(data);
                this.formatTimes();
                // hack to get polymer to update
                this.battles = JSON.parse(JSON.stringify(this.battles))
            })})
      .catch(e => console.error(e))
    },
    properties: {
      foo: {
        type: String,
        value: '1234',
        notify: true
      }
    }
  });
  })();