import 'babel-polyfill';
import assert, {equal, deepEqual} from 'assert';
import MutationEvent from '../../main/js/MutationEvent';
import EventDispatcher from '../../main/js/EventDispatcher';
import AttributeDescriptor, * as STATICS from '../../main/js/AttributeDescriptor';

describe('then', () => {

  it('creates new `AttributeDescriptor`', () => {
    let get = val => val * 2,
        set = val => val / 2,
        serializable = false,
        required = true,
        constant = true,
        _default = 123;

    let ad = STATICS.then({get, set, serializable, required, constant, default: _default});

    assert(ad instanceof AttributeDescriptor);
    equal(ad.get(111), 222);
    equal(ad.set(222), 111);
    equal(ad.serializable, serializable);
    equal(ad.required, required);
    equal(ad.constant, constant);
    equal(ad.default, _default);
  });
});

describe('propagate', () => {

  it('subscribes parent to `MutationEvent` emitted by provided `EventDispatcher`', done => {
    let parent = new EventDispatcher,
        child = new EventDispatcher;
    parent.addEventListener(MutationEvent, () => done());

    let ad = STATICS.propagate();
    assert(ad instanceof AttributeDescriptor);
    equal(ad.set.call(parent, child, undefined), child);

    child.dispatchEvent(new MutationEvent);
  });

  it('stops listening to previous value', done => {
    let parent = new EventDispatcher,
        child1 = new EventDispatcher,
        child2 = new EventDispatcher;
    parent.addEventListener(MutationEvent, () => done());

    let ad = STATICS.propagate();
    assert(ad instanceof AttributeDescriptor);
    equal(ad.set.call(parent, child1, undefined), child1);
    equal(ad.set.call(parent, child2, child1), child2);

    child1.dispatchEvent(new MutationEvent);
    child2.dispatchEvent(new MutationEvent);
  });
});

describe('construct', () => {

  it('creates new instance of given class', done => {
    let myInput = {};
    class ClassA {

      constructor (input) {
        equal(input, myInput);
        done();
      }
    }
    let ad = STATICS.construct(ClassA);
    assert(ad instanceof AttributeDescriptor);
    assert(ad.set(myInput) instanceof ClassA);
  });
});

describe('AttributeDescriptor', () => {

  it('allows chaining', () => {
    let ad = STATICS
      .then({get: val => val * 2})
      .then({set: val => val / 2});

    assert(ad instanceof AttributeDescriptor);
    equal(ad.get(111), 222);
    equal(ad.set(222), 111);
  });
});
