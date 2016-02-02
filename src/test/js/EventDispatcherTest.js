import 'babel-polyfill';
import {equal, deepEqual} from 'assert';
import EventDispatcher, {LISTENERS} from '../../main/js/EventDispatcher';

describe('EventDispatcher', () => {

  it('uses private properties', () => {
    equal(JSON.stringify(new EventDispatcher), '{}');
  });
});

describe('EventDispatcher#addEventEventListener', () => {

  function listener1 () {}
  function listener2 () {}

  class TestEvent1 {}
  class TestEvent2 {}

  it('adds listener to event type', () => {
    let target = new EventDispatcher;
    target.addEventListener(TestEvent1, listener1);

    equal(Array.from(target[LISTENERS].get(TestEvent1)).indexOf(listener1), 0);
  });

  it('does not add same listener twice', () => {
    let target = new EventDispatcher;
    target.addEventListener(TestEvent1, listener1);
    target.addEventListener(TestEvent1, listener2);
    target.addEventListener(TestEvent1, listener1);

    equal(Array.from(target[LISTENERS].get(TestEvent1)).indexOf(listener1), 0);
    equal(Array.from(target[LISTENERS].get(TestEvent1)).indexOf(listener2), 1);
  });

  it('can add listener to multiple event types', () => {
    let target = new EventDispatcher;
    target.addEventListener(TestEvent1, TestEvent2, listener1);

    equal(Array.from(target[LISTENERS].get(TestEvent1)).indexOf(listener1), 0);
    equal(Array.from(target[LISTENERS].get(TestEvent2)).indexOf(listener1), 0);
  });
});

describe('EventDispatcher#removeEventListener', () => {

  function listener1 () {}
  function listener2 () {}

  class TestEvent1 {}
  class TestEvent2 {}
  class TestEvent3 {}

  it('removes listener from event type', () => {
    let target = new EventDispatcher;
    target.addEventListener(TestEvent1, listener1);
    target.addEventListener(TestEvent1, listener2);
    target.removeEventListener(TestEvent1, listener1);

    equal(target[LISTENERS].get(TestEvent1).size, 1);
    equal(Array.from(target[LISTENERS].get(TestEvent1)).indexOf(listener2), 0);
  });

  it('can remove listener from multiple event types', () => {
    let target = new EventDispatcher;
    target.addEventListener(TestEvent1, TestEvent2, TestEvent3, listener1);
    target.removeEventListener(TestEvent1, TestEvent2, listener1);

    equal(target[LISTENERS].get(TestEvent1).size, 0);
    equal(target[LISTENERS].get(TestEvent2).size, 0);
    equal(target[LISTENERS].get(TestEvent3).size, 1);
  });

  it('can remove listener from all event types', () => {
    let target = new EventDispatcher;
    target.addEventListener(TestEvent1, TestEvent2, listener1);
    target.removeEventListener(listener1);

    equal(target[LISTENERS].get(TestEvent1).size, 0);
    equal(target[LISTENERS].get(TestEvent2).size, 0);
  });

  it('does not affect dispatch', () => {
    var trace = [];
    function listener1 () {
      trace.push(listener1);
      this.removeEventListener(listener1);
    }
    function listener2 () {
      trace.push(listener2);
    }
    let target = new EventDispatcher;
    target.addEventListener(TestEvent1, listener1);
    target.addEventListener(TestEvent1, listener2);

    target.dispatchEvent(new TestEvent1);
    deepEqual(trace, [listener1, listener2]);
  });
});

describe('EventDispatcher#dispatchEvent', () => {

  class TestEvent1 {}
  class TestEvent2 {}
  class TestEvent3 extends TestEvent1 {}

  it('invokes listeners for an event by its type', () => {
    var trace = [];
    function listener1 () {
      trace.push(listener1);
    }
    function listener2 () {
      trace.push(listener2);
    }
    function listener3 () {
      trace.push(listener3);
    }
    let target = new EventDispatcher;
    target.addEventListener(TestEvent1, listener1);
    target.addEventListener(TestEvent1, listener2);
    target.addEventListener(TestEvent2, listener3);

    target.dispatchEvent(new TestEvent1);
    deepEqual(trace, [listener1, listener2]);

    target.dispatchEvent(new TestEvent2);
    deepEqual(trace, [listener1, listener2, listener3]);
  });

  it('looks-up event listener by `instanceof`', () => {
    var trace = [];
    function listener1 () {
      trace.push(listener1);
    }
    function listener2 () {
      trace.push(listener2);
    }
    let target = new EventDispatcher;
    target.addEventListener(TestEvent1, listener1);
    target.addEventListener(TestEvent3, listener2);

    target.dispatchEvent(new TestEvent3);
    deepEqual(trace, [listener1, listener2]);
  });

  it('does not fire same listener multiple times during single dispatch', done => {
    function listener () {
      done();
    }
    let target = new EventDispatcher;
    target.addEventListener(TestEvent1, listener);
    target.addEventListener(TestEvent3, listener);

    target.dispatchEvent(new TestEvent3);
  });
});

describe('EventDispatcher#transaction', () => {

  class TestEvent1 {}
  class TestEvent2 {}

  it('invokes callback and dispatches events only after completion', () => {
    let target = new EventDispatcher,
        flag1 = false,
        flag2 = false,
        listenerCallCount = 0;

    // Both of these listeners should see both flags to have updated value.
    function listener1 () {
      equal(flag1, true);
      equal(flag2, true);
      listenerCallCount++;
    }
    function listener2 () {
      equal(flag1, true);
      equal(flag2, true);
      listenerCallCount++;
    }

    target.addEventListener(TestEvent1, listener1);
    target.addEventListener(TestEvent2, listener2);

    target.transaction(() => {
      flag1 = true;
      target.dispatchEvent(new TestEvent1);
      flag2 = true;
      target.dispatchEvent(new TestEvent2);
    });

    equal(listenerCallCount, 2);
    equal(target.dispatchEvent, EventDispatcher.prototype.dispatchEvent);
  });

  it('reverts `dispatchEvent` to initial state on callback failure', done => {
    let target = new EventDispatcher;
    try {
      target.transaction(() => {
        throw new Error('Expected error');
      });
    } catch (e) {
      equal(target.dispatchEvent, EventDispatcher.prototype.dispatchEvent);
      done();
    }
  });
});
