import 'babel-polyfill';
import assert, {equal, deepEqual, notEqual} from 'assert';
import Model from '../../main/js/Model';
import List from '../../main/js/List';
import AddEvent from '../../main/js/AddEvent';
import RemoveEvent from '../../main/js/RemoveEvent';
import SortEvent from '../../main/js/SortEvent';

describe('List#[]', () => {

  it('converts objects to model and updates length', () => {
    let list = new List;
    list[0] = {};
    list[2] = 'abc';
    list[3] = null;
    assert(list[0] instanceof Model);
    equal(list[1], undefined);
    assert(list[2] instanceof Model);
    assert(list[3] instanceof Model);
    equal(list.length, 4);
  });

  it('does not convert `undefined` to model', () => {
    let list = new List;
    list[1] = undefined;
    equal(list[0], undefined);
    equal(list[1], undefined);
    equal(list.length, 2);
  });

  it('does not clone model', () => {
    let model = new Model,
        list = new List;
    list[0] = model;
    equal(list[0], model);
    equal(list.length, 1);
  });

  it('raises `AddEvent` event if model is added', done => {
    let model = new Model,
        list = new List;
    list.addEventListener(AddEvent, () => done());
    list[0] = model;
    list[0] = model; // Does not call `done` because of no list change.
  });

  it('raises `RemoveEvent` event if index was set `undefined`', done => {
    let model = new Model,
        list = new List;
    list.addEventListener(RemoveEvent, event => {
      equal(event.model, model);
      done();
    });
    list[0] = model;
    list[0] = undefined;
  });

  it('does not raise `RemoveEvent` event if model replaces `undefined` item', done => {
    let list = new List;
    list.addEventListener(RemoveEvent, () => {throw new Error('`RemoveEvent` event should not be raised when replacing `undefined`')});
    list.addEventListener(AddEvent, () => done());
    list[0] = undefined;
    list[0] = {};
  });

  it('raises `AddEvent` and `RemoveEvent` event if model was replaced with another model', () => {
    let addedModel,
        removedModel;
    let model1 = new Model,
        model2 = new Model,
        list = new List;
    list.addEventListener(AddEvent, event => addedModel = event.model);
    list.addEventListener(RemoveEvent, event => removedModel = event.model);
    list[0] = model1;
    list[0] = model2;

    equal(addedModel, model2);
    equal(removedModel, model1);
  });

  it('makes updated index enumerable', () => {
    let list = new List([{}, {}]);
    assert(list.hasOwnProperty(0));
    assert(list.hasOwnProperty(1));

    list.length = 1;
    assert(list.hasOwnProperty(0));
    assert(!list.hasOwnProperty(1));
  });
});

describe('List#push', () => {

  it('pushes model to list', () => {
    let list = new List;
    list[0] = {};
    list.push({});
    let pushLength = list.push(undefined);

    assert(list[0] instanceof Model);
    assert(list[1] instanceof Model);
    equal(list[2], undefined);
    equal(list.length, 3);
    equal(pushLength, 3);
  });

  it('raises `AddEvent`', done => {
    let model = new Model,
        list = new List;
    list.addEventListener(AddEvent, event => {
      equal(event.model, model);
      done();
    });
    list.push(model);
  });

  it('can push multiple events at a time', () => {
    let list = new List;
    list.push({}, {}, {});
    equal(list.length, 3);
  });
});

describe('List#slice', () => {

  it('changes array and raises `AddEvent` and `RemoveEvent`', () => {
    let model1 = new Model({id: 1}),
        model2 = new Model({id: 2}),
        model3 = new Model({id: 3}),
        list = new List([{}, model1, model2, {}]);

    let removedModels = [],
        addedModels = [];
    list.addEventListener(RemoveEvent, event => removedModels.push(event.model));
    list.addEventListener(AddEvent, event => addedModels.push(event.model));

    list.splice(1, 2, model3);

    deepEqual(removedModels, [model1, model2]);
    deepEqual(addedModels, [model3]);
  });

  it('raises `SortEvent` if only model order was changed', () => {
    let model1 = new Model({id: 1}),
        model2 = new Model({id: 2}),
        list = new List([{}, model1, model2, {}]);

    list.addEventListener(RemoveEvent, () => {throw new Error('`RemoveEvent` event should not be raised during sorting')});
    list.addEventListener(AddEvent, () => {throw new Error('`AddEvent` event should not be raised during sorting')});

    let sortedModels = [];
    list.addEventListener(SortEvent, event => sortedModels.push(event.model));

    list.splice(1, 2, model2, model1);
    deepEqual(sortedModels, [model1, model2]);
  });
});

describe('List#transaction', () => {

  it('does not fire excessive events', () => {
    let model1 = new Model({id: 1}),
        model2 = new Model({id: 2}),
        list = new List([{}, model1, model2, {}]);

    list.addEventListener(RemoveEvent, () => {throw new Error('`RemoveEvent` event should not be raised during transaction')});
    list.addEventListener(AddEvent, () => {throw new Error('`AddEvent` event should not be raised during transaction')});

    let sortedModels = [];
    list.addEventListener(SortEvent, event => sortedModels.push(event.model));

    list.transaction(() => {
      list[1] = {};
      notEqual(list[1], model1);

      list[2] = undefined;
      equal(list[2], undefined);

      // Sort models manually
      list[2] = model1;
      list[1] = model2;
    });
    deepEqual(sortedModels, [model1, model2]);
  });
});

describe('List#constructor', () => {

  it('accepts Array-like object as initial state', () => {
    let model1 = new Model({id: 1}),
        model2 = new Model({id: 2}),
        list = new List([model1, model2]);
    equal(list[0], model1);
    equal(list[1], model2);
    equal(list.length, 2);
  });
});

describe('List', () => {

  it('can be iterated with `for of`', () => {
    let model1 = new Model({id: 1}),
        model2 = new Model({id: 2}),
        list = new List([model1, model2]);
    let array = [];
    for (let model of list) {
      array.push(model);
    }
    deepEqual(array, [model1, model2]);
  });
});

describe('List.of', () => {

  it('creates list of given model type', () => {
    class ModelA extends Model {}
    let ModelAList = List.of(ModelA);
    assert(ModelAList instanceof Function);

    let modelAList = new ModelAList;
    modelAList.push({});
    assert(modelAList.pop() instanceof ModelA);
  });

  it('returns same constructor for same model', () => {
    class ModelA extends Model {}
    equal(List.of(ModelA), List.of(ModelA));
    equal(List, List.of(Model));
  });
});
