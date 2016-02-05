import isFunction from 'lodash.isfunction';
import EventDispatcher from './EventDispatcher';
import MutationEvent from './MutationEvent';

export default class ChainableDescriptor {

  constructor (parent, descriptor) {
    this.parent = parent;
    if (descriptor instanceof Object) {
      this.descriptor = descriptor;
    } else {
      throw new Error('Expected descriptor to be an object');
    }

    let _self = this;

    this.get = function (val) {
      for (let self = _self; self instanceof ChainableDescriptor; self = self.parent) {
        if ('get' in self.descriptor) {
          val = self.descriptor.get.call(this, val);
        }
      }
      return val;
    };

    this.set = function (val, previous) {
      let parents = [];
      for (let self = _self; self instanceof ChainableDescriptor; self = self.parent) {
        parents.push(self);
      }
      parents.reverse();
      for (let parent of parents) {
        if (parent && 'set' in parent.descriptor) {
          val = parent.descriptor.set.call(this, val, previous);
        }
      }
      return val;
    };
  }

  get default () {
    let self = this;
    while (self && !('default' in self.descriptor)) {
      self = self.parent;
    }
    if (self) {
      return self.descriptor.default;
    }
    return undefined;
  }

  get required () {
    let self = this;
    while (self && !('required' in self.descriptor)) {
      self = self.parent;
    }
    if (self) {
      return self.descriptor.required;
    }
    return false;
  }

  get constant () {
    let self = this;
    while (self && !('constant' in self.descriptor)) {
      self = self.parent;
    }
    if (self) {
      return self.descriptor.constant;
    }
    return false;
  }

  get serializable () {
    let self = this;
    while (self && !('serializable' in self.descriptor)) {
      self = self.parent;
    }
    if (self) {
      return self.descriptor.serializable;
    }
    return true;
  }
}

Object.assign(ChainableDescriptor.prototype, {
  then,
  assert,
  process,
  propagate,
  construct,
  isRequired,
  defaultValue,
  notSerializable,
  nested
});

export function then (descriptor) {
  return new ChainableDescriptor(this, descriptor);
}

export function assert (predicate, message = 'Assertion failed') {
  if (!isFunction(predicate)) {
    throw new Error('Expected predicate to be a function');
  }
  return then.call(this, {
    set (val, previous) {
      if (predicate(val)) {
        return val;
      }
      throw new Error(message);
    }
  });
}

export function process (processor) {
  if (!isFunction(processor)) {
    throw new Error('Expected processor to be a function');
  }
  return then.call(this, {set: processor});
}

export function propagate (classes = [MutationEvent]) {
  function listener (event) {
    event.relatedTarget = this;
    listener.parent.dispatchEvent(event);
  }

  return then.call(this, {
    set (val, previous) {
      listener.parent = this;
      if (val !== previous) {
        if (previous instanceof EventDispatcher) {
          previous.removeEventListener(...classes, listener);
        }
        if (val instanceof EventDispatcher) {
          val.addEventListener(...classes, listener);
        }
      }
      return val;
    }
  });
}

export function construct (Class) {
  if (!isFunction(Class)) {
    throw new Error('Expected class constructor');
  }
  return then.call(this, {
    set (val, previous) {
      if (!(val instanceof Class)) {
        val = new Class(val);
      }
      return val;
    }
  });
}

export function defaultValue (defaultValue = undefined) {
  return then.call(this, {default: defaultValue});
}

export function isRequired () {
  return then.call(this, {required: true});
}

/**
 * @return {ChainableDescriptor}
 */
export function notSerializable () {
  return then.call(this, {serializable: false});
}

export function nested (Class) {
  return construct.call(this, Class).propagate();
}
