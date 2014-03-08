var assert = require('assert');
var createView = require('view');
var interpolate = require('view-interpolate');

describe('view-interpolate', function(){
  var View;

  beforeEach(function () {
    View = createView('<div></div>');
    View.use(interpolate);
  });

  it('should have a different interpolator for each View', function () {
    var count = 0;
    var One = createView('<div></div>').use(interpolate);
    var Two = createView('<div></div>').use(interpolate);
    One.filter('foo', function(){
      count++;
    });
    var one = new One();
    var two = new Two();
    assert(one.hasFilter('foo'));
    assert(two.hasFilter('foo') === false);
  });

  it('should have the same interpolator for each view instance', function () {
    var count = 0;
    View.filter('foo', function(){
      count++;
    });
    var one = new View();
    var two = new View();
    assert(one.hasFilter('foo'));
    assert(two.hasFilter('foo'));
  });

  it('should interpolate once', function(){
    var view = View.create({
      state: {
        foo: 'bar'
      }
    });
    assert(view.interpolate('{{foo}}') === 'bar');
  });

  it('should throw an error if trying to interpolate with a property that does not exist', function(done){
    var view = new View();
    try {
      view.interpolate('{{name}}', function(){
        done(false);
      });
    }
    catch(e) {
      assert(e.message);
      return done();
    }
    done(false);
  });

  describe('properties', function () {
    it('should not interpolate a string using properties', function(done){
      var view = new View({
        'name': 'Fred'
      });
      try {
        view.interpolate('{{name}}', function(val){
          done(false);
        });
      }
      catch(e){
        assert(e.message);
        done();
      }
    });
  });

  describe('state', function () {

    it('should interpolate a string using state', function(done){
      var view = View.create({
        state: {
          foo: 'bar'
        }
      });
      view.interpolate('{{foo}}', function(val){
        assert(val === "bar");
        done();
      });
    });

    it('should update when a state changes', function(){
      var name;
      var view = View.create({
        state: {
          name: 'Fred'
        }
      });
      view.interpolate('{{name}}', function(val){
        name = val;
      });
      view.state.set('name', 'Barney');
      assert(name === "Barney");
    });

    it('should remove the binding when the view is destroyed', function(){
      var name;
      var view = View.create({
        state: {
          name: 'Fred'
        }
      });
      view.interpolate('{{name}}', function(val){
        name = val;
      });
      assert(name === "Fred");
      view.destroy();
      view.state.set('name', 'Barney');
      assert(name === "Fred");
    });

    it('should return the raw value for simple expressions', function(done){
      var name;
      var view = View.create({
        state: {
          names: ['Fred']
        }
      });
      view.interpolate('{{names}}', function(val){
        assert(Array.isArray(val));
        assert(val[0] === 'Fred');
        done();
      });
    });

  });

  describe('owner', function () {
    var parent, child, grandparent;

    beforeEach(function () {
      grandparent = View.create({
        state: {
          grandstate: 'one'
        },
        props: {
          grandprop: 'two'
        }
      });
      parent = View.create({
        state: {
          name: 'Fred'
        },
        props: {
          model: 'foo'
        },
        owner: grandparent
      });
      child = View.create({
        owner: parent
      });
    });

    it('should not interpolate a string using owner property', function(done){
      try {
        child.interpolate('{{model}}', function(val){
          done(false);
        });
      }
      catch(e){
        done();
      }
    });

    it('should interpolate a string using owner state', function(done){
      child.interpolate('{{name}}', function(val){
        assert(val === "Fred")
        done();
      });
    });

    it('should interpolate multiple levels up', function(done){
      child.interpolate('{{grandstate}}', function(val){
        assert(val === "one");
        done();
      });
    });

    it('should update when a owner changes', function(){
      var value;
      child.interpolate('{{grandstate}}', function(val){
        value = val;
      });
      grandparent.state.set('grandstate', 'foo');
      assert(value === 'foo');
    });

    it('should remove the binding when the view is destroyed', function(){
      var value;
      child.interpolate('{{grandstate}}', function(val){
        value = val;
      });
      child.destroy();
      grandparent.state.set('grandstate', 'foo');
      assert(value === 'one');
    });

  });

});