import EventDispatcher from './EventDispatcher';
import Model from './Model';
import SortEvent from './SortEvent';
import AddEvent from './AddEvent';
import RemoveEvent from './RemoveEvent';

const ARRAY = Symbol('array');
const BACKING_ARRAY = Symbol('backingArray');
const MODEL = Symbol('model');
const CACHE = new Map;

export default class List extends EventDispatcher {

  constructor (models) {
    super();
    this[ARRAY] = [];
    this[BACKING_ARRAY] = [];
    if (models && !Array.isArray(models)) {
      models = [models];
    }
    Object.assign(this, models);
  }

  static of (Model) {
    let TypedList = CACHE.get(Model);
    if (TypedList) {
      return TypedList;
    }
    //class TypedList extends List {}
    //TypedList.prototype[MODEL] = Model;
    //CACHE.set(Model, TypedList);
    //return TypedList;
  }

  get length () {
    return this[ARRAY].length;
  }

  set length (length) {
    this[ARRAY].length = length;
    for (let j = 0; j < this[BACKING_ARRAY].length; ++j) {
      let backingItem = this[BACKING_ARRAY][j];
      let i = this[ARRAY].indexOf(backingItem);
      if (i >= 0 && i != j) {
        this.dispatchEvent(new SortEvent(this, j));
      }
      if (i == -1) {
        this.dispatchEvent(new RemoveEvent(this));
      }
    }
    for (let i = 0; i < this[ARRAY].length; ++i) {
      if (!this[BACKING_ARRAY].includes(this[ARRAY][i])) {
        this.dispatchEvent(new AddEvent(this));
      }
    }
    this[BACKING_ARRAY] = this[ARRAY].slice();
  }

  toJSON () {
    return this[ARRAY].slice();
  }

  update (models) {
    if (Array.isArray(models)) {
      models: for (let model of models) {
        if (this.includes(model)) {
          continue; // Update not required - list member received.
        }
        let id = model.getId();
        if (id !== undefined) {
          for (let item of this[ARRAY]) {
            if (item && item.getId() === id) {
              item.update(model);
              continue models;
            }
          }
        }
        this.push(model);
      }
    }
  }
}

for (let key of Object.getOwnPropertyNames(Array.prototype)) {
  if (!List.prototype.hasOwnProperty(key)) {
    Object.defineProperty(List.prototype, key, Object.getOwnPropertyDescriptor(Array.prototype, key));
  }
}

List.prototype[MODEL] = Model;
CACHE.set(Model, List);

for (let i = 0; i < 100; ++i) {
  Object.defineProperty(List.prototype, i, {
    get () {
      return this[ARRAY][i];
    },
    set (model) {
      let Model = this[MODEL];
      if (model instanceof Model == false) {
        model = new Model(model);
      }
      this[ARRAY][i] = model;
      console.log('SET ITEM ' + i);
      this.length = (this.length);
    }
  });
}
