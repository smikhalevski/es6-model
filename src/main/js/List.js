import EventDispatcher from './EventDispatcher';
import Model from './Model';
import SortEvent from './SortEvent';
import AddEvent from './AddEvent';
import RemoveEvent from './RemoveEvent';

const ARRAY = Symbol('array');
const PREVIOUS_ARRAY = Symbol('backingArray');
const MODEL = Symbol('model');
const CACHE = new Map;
const PREVENT_ITEM_LENGTH_UPDATE = Symbol('noLengthUpdate');

export default class List extends EventDispatcher {

  constructor (models) {
    super();
    this[ARRAY] = [];
    if (models && !Array.isArray(models)) {
      models = [models];
    }
    this[PREVENT_ITEM_LENGTH_UPDATE] = true;
    try {
      Object.assign(this, models);
    } finally {
      this[PREVENT_ITEM_LENGTH_UPDATE] = false;
    }
    this[PREVIOUS_ARRAY] = this[ARRAY].slice();
  }

  static of (Model) {
    let TypedList = CACHE.get(Model);
    if (TypedList) {
      return TypedList;
    }
    TypedList = Function('List', `return function ${Model.name}List () {List.apply(this, arguments)}`)(List);
    TypedList.prototype = Object.create(List.prototype);
    TypedList.prototype[MODEL] = Model;
    CACHE.set(Model, TypedList);
    return TypedList;
  }

  get length () {
    return this[ARRAY].length;
  }

  set length (length) {
    let previousArray = this[PREVIOUS_ARRAY],
        array = this[ARRAY];
    array.length = length;
    let removeCount = 0;
    for (let j = 0; j < previousArray.length; ++j) {
      let previousItem = previousArray[j];
      if (previousItem === array[j]) {
        continue; // No changes for this item.
      }
      let i = array.indexOf(previousItem);
      if (i >= 0 && i != j) {
        this.dispatchEvent(new SortEvent(previousItem, j));
      }
      if (i < 0) {
        removeCount++;
        if (previousItem !== undefined) {
          this.dispatchEvent(new RemoveEvent(previousItem));
        }
      }
    }
    if (previousArray.length - removeCount !== array.length) {
      for (let i = 0; i < array.length; ++i) {
        if (previousArray[i] !== array[i] && !previousArray.includes(array[i])) {
          this.dispatchEvent(new AddEvent(array[i]));
        }
      }
    }
    for (let i = previousArray.length - 1; i >= previousArray.length - removeCount; --i) {
      delete this[i];
    }
    this[PREVIOUS_ARRAY] = array.slice();
  }

  toJSON () {
    return this.valueOf();
  }

  valueOf () {
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

  transaction (callback) {
    this[PREVENT_ITEM_LENGTH_UPDATE] = true;
    try {
      super.transaction(callback);
    } finally {
      this[PREVENT_ITEM_LENGTH_UPDATE] = false;
      this.length = (this.length);
    }
  }

  [Symbol.iterator]() {
    return this[ARRAY][Symbol.iterator]();
  }
}

for (let key of Object.getOwnPropertyNames(Array.prototype)) {
  if (!List.prototype.hasOwnProperty(key)) {
    Object.defineProperty(List.prototype, key, {
      value: function () {
        this[PREVENT_ITEM_LENGTH_UPDATE] = true;
        try {
          return Array.prototype[key].apply(this, arguments);
        } finally {
          this[PREVENT_ITEM_LENGTH_UPDATE] = false;
        }
      }
    });
  }
}

List.prototype[MODEL] = Model;
CACHE.set(Model, List);

for (let i = 0; i < 10000; ++i) {
  Object.defineProperty(List.prototype, i, {
    enumerable: true,
    configurable: true,
    get () {
      return this[ARRAY][i];
    },
    set (model) {
      if (model !== undefined) {
        let Model = this[MODEL];
        if (!(model instanceof Model)) {
          model = new Model(model);
        }
      }
      if (!this.hasOwnProperty(i)) {
        Object.defineProperty(this, i, Object.getOwnPropertyDescriptor(List.prototype, i));
      }
      this[ARRAY][i] = model;
      if (!this[PREVENT_ITEM_LENGTH_UPDATE]) {
        this.length = (this.length);
      }
    }
  });
}
