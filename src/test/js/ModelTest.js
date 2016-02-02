import 'babel-polyfill';
import {equal, deepEqual, throws} from 'assert';
import Model from '../../main/js/Model';
import ChangeEvent from '../../main/js/ChangeEvent';

class ModelA extends Model {
  static attributes = {
    a: {default: 1},
    b: {default: 2},
    c: {default: 3}
  };
}

class ModelB extends ModelA {
  static attributes = {
    d: {default: 4},
    e: {default: 5},
    f: {default: 6}
  };
}

class ModelC extends Model {
  static attributes = {
    a: {},
    b: {},
    c: {}
  };
}
const COUNT = 10000;


// Performance test 1
for (let i = 0; i < COUNT; ++i) {
  new Model;
}
const TEST1 = `Create ${COUNT} models Model`;
console.time(TEST1);
for (let i = 0; i < COUNT; ++i) {
  new Model;
}
console.timeEnd(TEST1);


// Performance test 2
for (let i = 0; i < COUNT; ++i) {
  new ModelB;
}
const TEST2 = `Create ${COUNT} models ModelA extends ModelB, where each have 3 attributes with defaults`;
console.time(TEST2);
for (let i = 0; i < COUNT; ++i) {
  new ModelB;
}
console.timeEnd(TEST2);


// Performance test 3
for (let i = 0; i < COUNT; ++i) {
  new ModelC;
}
const TEST3 = `Create ${COUNT} models ModelC with 3 attributes without defaults`;
console.time(TEST3);
for (let i = 0; i < COUNT; ++i) {
  new ModelC;
}
console.timeEnd(TEST3);


describe('Model#constructor', () => {

  it('accepts initial values', () => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {}
        }
      }
    }
    let modelA = new ModelA({foo: 123});
    equal(modelA.foo, 123);
  });

  it('uses undefined, nulls, primitives and wrappers, arrays and functions as default values of an attribute', () => {
    let myArray = [],
        myObject = {};
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          a: 'abc',
          b: new String('abc'),
          c: 123,
          d: new Number(123),
          e: false,
          f: true,
          g: myArray,
          h: {default: myObject}
        }
      }
    }
    let modelA = new ModelA;
    equal(modelA.a, 'abc');
    equal(modelA.b, 'abc');
    equal(modelA.c, 123);
    equal(modelA.d, 123);
    equal(modelA.e, false);
    equal(modelA.f, true);
    equal(modelA.g, myArray);
    equal(modelA.h, myObject); // Because object is considered to be a descriptor.
  });

  it('uses `default` as default value which can be overridden by initial value', () => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {default: 123}
        }
      }
    }
    let modelA;

    modelA = new ModelA;
    equal(modelA.foo, 123);

    modelA = new ModelA({foo: 'abc'}); // Override default.
    equal(modelA.foo, 'abc');
  });

  it('calls setter to set value from `default` if `default` is explicitly specified', done => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {
            set: val => {
              done();
              return val * 2;
            },
            default: 111
          },
          bar: {
            // This done should never be called because of no `default` provided.
            set: val => done()
          }
        }
      }
    }
    let modelA = new ModelA;
    equal(modelA.foo, 222);
  });

  it('throws if `required` attribute receives `undefined` value on initialization', () => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {required: true}
        }
      }
    }
    throws(() => new ModelA, 'Required attribute ModelA[foo] cannot be undefined');
    throws(() => new ModelA({foo: undefined}), 'Required attribute ModelA[foo] cannot be undefined');
    let modelA = new ModelA({foo: 123});
    equal(modelA.foo, 123);

    class ModelB extends Model {
      static get [Model.attributes]() {
        return {
          foo: {
            required: true,
            default: undefined
          }
        }
      }
    }
    throws(() => new ModelB, 'Required attribute ModelB[foo] cannot be undefined');
    throws(() => new ModelB({foo: undefined}), 'Required attribute ModelB[foo] cannot be undefined');
    let modelB = new ModelB({foo: 123});
    equal(modelB.foo, 123);

    class ModelC extends Model {
      static get [Model.attributes]() {
        return {
          foo: {
            required: true,
            default: 'abc'
          }
        }
      }
    }
    let modelC = new ModelC;
    equal(modelC.foo, 'abc');
    throws(() => new ModelC({foo: undefined}), 'Required attribute ModelB[foo] cannot be undefined');
  });

  it('permits that `get` and `set` can be omitted', () => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {}
        }
      }
    }
    let modelA = new ModelA;
    modelA.foo = 123;
    equal(modelA.foo, 123);
  });

  it('uses `get` in attribute getter if `get` is defined in attribute descriptor', () => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {get: val => val * 2}
        }
      }
    }
    let modelA = new ModelA;
    modelA.foo = 111;
    equal(modelA.foo, 222);
  });

  it('uses `set` in attribute setter if `set` is defined in attribute descriptor', () => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {set: (val, previous) => previous + '_' + val * 2}
        }
      }
    }
    let modelA = new ModelA;
    modelA.foo = 111;
    equal(modelA.foo, 'undefined_222');
    equal(modelA.foo, 'undefined_222'); // Check setter is used, not getter.
    modelA.foo = 444;
    equal(modelA.foo, 'undefined_222_888');
    equal(modelA.foo, 'undefined_222_888');
  });

  it('requires `get` to be a function or absent', () => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {
            get: 'bad_get'
          }
        }
      }
    }
    throws(() => new ModelA, 'Expected getter of ModelA[foo] to be a function');
  });

  it('requires `set` to be a function or absent', () => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {
            set: 'bad_set'
          }
        }
      }
    }
    throws(() => new ModelA, 'Expected setter of ModelA[foo] to be a function');
  });

  it('creates getter that throws descriptive errors', () => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {
            get: val => {
              throw new Error('Expected error');
            }
          }
        }
      }
    }
    let modelA = new ModelA;
    throws(() => modelA.foo, 'Get of attribute ModelA[foo] failed\nError: Expected error');
  });

  it('creates setter that throws descriptive errors', () => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {
            set: (val, previous) => {
              throw new Error('Expected error');
            }
          }
        }
      }
    }
    let modelA = new ModelA;
    throws(() => modelA.foo = 123, 'Set of attribute ModelA[foo] failed\nError: Expected error');
  });

  it('defines property accessors', () => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {
            set (val, previous) {
              this.bar = val;
              return val * 2;
            },
            get: val => val * 2
          }
        }
      }
    }
    let modelA = new ModelA;
    modelA.foo = 111;
    equal(modelA.foo, 444); // Multiplied on save and on read
    equal(modelA.bar, 111);
  });

  it('creates setter that raises change events', done => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {}
        }
      }
    }
    let modelA = new ModelA;
    modelA.addEventListener(ChangeEvent, event => done());
    modelA.foo = 123;
  });

  it('creates setter that does not fire change event if attribute value did not change', done => {
    class A extends Model {
      static get [Model.attributes]() {
        return {
          foo: {}
        }
      }
    }
    let a = new A;
    a.addEventListener(ChangeEvent, event => done());
    a.foo = 123;
    a.foo = 123; // Second call of `done` may occur if buggy setter
  });

  it('inherits attributes from super class', () => {
    let myObject = {};
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          a: 123,
          b: 'abc'
        }
      }
    }
    class ModelB extends ModelA {
      static get [Model.attributes]() {
        return {
          c: true,
          d: {
            get default () {
              return myObject;
            }
          }
        }
      }
    }
    let modelB = new ModelB;
    equal(modelB.a, 123);
    equal(modelB.b, 'abc');
    equal(modelB.c, true);
    equal(modelB.d, myObject);
  });

  it('defines non-serializable attributes as non-enumerable', () => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {serializable: false}
        }
      }
    }
    let modelA = new ModelA;
    modelA.foo = 123;
    equal(modelA.hasOwnProperty('foo'), true);
    equal(modelA.propertyIsEnumerable('foo'), false);
    equal(modelA.foo, 123);
  });

  it('creates object that can be cloned', () => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          a: {serializable: false},
          b: 'abc',
          c: {
            constant: true,
            default: 123
          },
          d: {required: true},
          e: {
            serializable: false,
            required: true,
            default: 'test'
          }
        }
      }
    }
    let modelA = new ModelA({a: 'holly', d: 'dolly'});
    equal(modelA.a, 'holly');
    equal(modelA.b, 'abc');
    equal(modelA.c, 123);
    equal(modelA.d, 'dolly');
    equal(modelA.e, 'test');
    deepEqual(Object.assign({}, modelA), {b: 'abc', c: 123, d: 'dolly'});
  });

  it('does not add setter for constant attributes', () => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {
            constant: true,
            default: 123
          }
        }
      }
    }
    let modelA = new ModelA;
    equal(modelA.foo, 123);
    throws(() => modelA.foo = 345);
  });

  it('throws error if constant attribute has not `default` or was not provided during initialization', () => {
    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          foo: {constant: true}
        }
      }
    }
    throws(() => new ModelA);
    let modelA = new ModelA({foo: 123});
    equal(modelA.foo, 123);
  });

  it('uses non-Symbol attributes by default', () => {
    class ModelA extends Model {
      static attributes = {
        foo: 'abc'
      };
    }
    let modelA = new ModelA;
    equal(modelA.foo, 'abc');
  });
});

describe('Model#getId', () => {

  it('uses `this.id` as identifier', () => {
    let model = new Model;
    equal(model.getId(), undefined);

    model = new Model({id: 'abc'});
    equal(model.getId(), 'abc');

    class ModelA extends Model {
      static get [Model.attributes]() {
        return {
          id: {
            get: val => val * 2,
            constant: true,
            default: 111
          }
        }
      }
    }
    let modelA = new ModelA;
    equal(modelA.getId(), 222);
  });
});

describe('Model#update', () => {

  it('fires change events for non-attribute model properties', done => {
    let model = new Model;
    model.addEventListener(ChangeEvent, function (event) {
      equal(event.key, 'foo');
      equal(this.foo, 123);
      done();
    });
    model.update({foo: 123});
  });

  it('calls `update` for nested objects', () => {
    class ModelA extends Model {
      static attributes = {
        myAttr: {
          get: val => '__' + val
        }
      };
    }

    let myUpdate = function (val) {
      this.foo = val;
    };
    let model = new Model({
      a: {
        update: myUpdate
      },
      b: 'abc',
      c: new ModelA
    });
    model.update({
      a: 'inner',
      b: 'replaced',
      c: {
        myAttr: 'suffix'
      }
    });
    deepEqual(model, {
      a: {
        foo: 'inner',
        update: myUpdate
      },
      b: 'replaced',
      c: {
        myAttr: '__suffix'
      }
    })
  });
});
