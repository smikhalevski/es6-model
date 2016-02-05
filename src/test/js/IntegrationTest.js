import 'babel-polyfill';
import {equal, deepEqual, throws} from 'assert';
import Model from '../../main/js/Model';
import List from '../../main/js/List';
import ChangeEvent from '../../main/js/ChangeEvent';
import {assert, nested, notSerializable} from '../../main/js/ChainableDescriptor';

describe('Integration', () => {

  it('can create arbitrary nested models', () => {
    class MooModel extends Model {
      sayMoo () {
        return 'Mooo!';
      }
    }

    class ModelA extends Model {
      static attributes = {
        foo: assert(Number.isInteger).process(val => val * 2),
        qux: 'abc',
        sef: notSerializable().defaultValue('test'),
        moo: nested(MooModel)
      };
    }

    class ModelB extends Model {
      static attributes = {
        bar: nested(List.of(ModelA))
      };
    }

    let modelB = new ModelB;
    modelB.bar = [
      {foo: 1, qux: 'another'},
      {foo: 2, sef: 123, moo: {plain: true}}
    ];

    equal(modelB.bar instanceof List.of(ModelA), true);

    equal(modelB.bar[0] instanceof ModelA, true);
    equal(modelB.bar[0].foo, 2);
    equal(modelB.bar[0].qux, 'another');
    equal(modelB.bar[0].sef, 'test');
    equal(modelB.bar[0].moo, undefined);

    equal(modelB.bar[1] instanceof ModelA, true);
    equal(modelB.bar[1].foo, 4);
    equal(modelB.bar[1].qux, 'abc');
    equal(modelB.bar[1].sef, 123);

    equal(modelB.bar[1].moo instanceof Model, true);
    equal(modelB.bar[1].moo.plain, true);
    equal(modelB.bar[1].moo.sayMoo(), 'Mooo!');

    throws(() => new ModelB({bar: [{foo: 1.5}]}),
      'Error: Set of attribute ModelB[bar] failed\n'
      + 'Error: Set of attribute ModelA[foo] failed\n'
      + 'Error: Assertion failed'
    );

    equal(JSON.stringify(modelB), '{"bar":[{"foo":2,"qux":"another"},{"foo":4,"qux":"abc","moo":{"plain":true}}]}');
  });

  it('allows to listen to events from deeply nested `EventDispatcher`s', done => {
    class ModelA extends Model {
      static attributes = {
        foo: 123
      };
    }

    class ModelB extends Model {
      static attributes = {
        modelAs: nested(List.of(ModelA))
      };
    }

    class ModelC extends Model {
      static attributes = {
        modelB: nested(ModelB)
      };
    }

    let modelA = new ModelA;
    let modelC = new ModelC({
      modelB: {
        modelAs: [
          modelA
        ]
      }
    });

    modelC.addEventListener(ChangeEvent, event => {
      equal(event.target, modelA);
      equal(event.relatedTarget, modelC.modelB);
      done();
    });
    modelA.foo = 'abc';
  });
});
