'use strict';
const rewire = require('rewire')

describe('smooth.js', function() {
  let smooth

  beforeEach(function(){
    smooth = rewire('../../../app/scripts/smooth.js')
    smooth.__set__('_functions', [])
  });

  it( 'should return first value of key', ()=> smooth('location',0).should.equal(0))
  
  it( 'should return first value of key2', ()=> smooth('location',10).should.equal(10))
  
  it( 'should return average value', ()=> {
    smooth('location',0)
    smooth('location',10).should.equal(5)
  })

  it( 'should return first value for new key', ()=> {
    smooth('location',0)
    smooth('location',10)
    smooth('______location',10).should.equal(10)
  })

  it( 'should only use last five values', ()=> {
    smooth('location',0)
    smooth('location',0)
    smooth('location',0)
    smooth('location',0)
    smooth('location',0)
    smooth('location',0)
    smooth('location',0)
    smooth('location',0)
    smooth('location',10).should.equal(2)
  })
});
