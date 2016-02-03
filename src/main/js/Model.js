import uniqueId from 'lodash.uniqueid';
import isFunction from 'lodash.isfunction';
import EventDispatcher from './EventDispatcher';
import ChangeEvent from './ChangeEvent';

const VALUES = Symbol('values');
const ID = Symbol('id');

/**
 * @class Model
 * @extends EventDispatcher
 * @classdesc
 * Model that uses accessor methods to mutate its attributes.
 *
 * Attributes can be redefined.
 *
 * Undefined, nulls, primitives and their wrappers, arrays and functions are treated as
 * default value if provided as attribute descriptor.
 *
 * Constant attribute requires `default` to be explicitly specified or its value should
 * be among initials. Constant attribute cannot be set after model initialization.
 *
 * @param {Object} [initials] Initial attribute values of model that override defaults.
 */
export default class Model extends EventDispatcher {

  /**
   * Symbol ar name of model static property that holds attribute descriptors.
   *
   * Accessed during construction of every instance of model class or its descendants.
   *
   * @name Model.attributes
   * @type {Symbol|String}
   * @default "attributes"
   */
  static attributes = 'attributes';

  constructor (initials) {
    super();
    if (this.constructor == Model) {
      Object.assign(this, initials);
      return;
    }
    this[VALUES] = {}; // Internal value storage.
    this[ID] = uniqueId('c');
    let defaults = {},
        initialized = false; // Let accessors know we are still in constructor.

    // Dive into prototype chain and create attribute accessors if needed.
    for (var self = this; self instanceof Model; self = Object.getPrototypeOf(self.constructor.prototype)) {
      let Class = self.constructor,
          attributes = Class.hasOwnProperty(Model.attributes) && Class[Model.attributes];

      if (!attributes) {
        continue; // Class has no attributes defined.
      }
      let descriptors = {}; // Descriptors to define for `this`.
      for (let key in attributes) {
        // Using `for in` to get rid of redundant objects created by `Object.entries`.
        if (this.hasOwnProperty(key)) {
          continue; // Attribute already defined for `this` by higher order model.
        }
        this[VALUES][key] = undefined; // Notify `Model.assign` about keys handled by model.

        let attribute, // Attribute descriptor
            val = attributes[key]; // Default value of an attribute
        if (val && typeof Object(val).valueOf() == 'object' && !Array.isArray(val)) {
          attribute = val;
          val = attribute.default;
        } else {
          attribute = {default: val}
        }
        let {get, set, serializable = true, constant = false} = attribute,
            path = `${Class.name}[${key}]`; // Object path of this attribute for better error messages.

        if ('get' in attribute && !isFunction(get)) {
          throw new Error(`Expected getter of ${path} to be a function`);
        }
        if ('set' in attribute && !isFunction(set)) {
          throw new Error(`Expected setter of ${path} to be a function`);
        }
        if (attribute.default !== undefined) {
          defaults[key] = attribute.default;
        }
        if (initials && key in initials) {
          defaults[key] = initials[key]; // Override defaults.
        }
        if (attribute.required && defaults[key] === undefined) {
          throw new Error(`Required attribute ${path} cannot be undefined`);
        }
        descriptors[key] = {enumerable: serializable, configurable: true};
        descriptors[key].get = function() {
          if (get) {
            try {
              return get.call(this, this[VALUES][key]);
            } catch (e) {
              e.message = `Get of attribute ${path} failed\n` + e;
              throw e;
            }
          }
          return this[VALUES][key];
        };
        let setter = function(update = val) {
          let previous = this[VALUES][key];
          if (set) {
            try {
              update = set.call(this, update, previous);
            } catch (e) {
              e.message = `Set of attribute ${path} failed\n` + e;
              throw e;
            }
          }
          if (Object.is(previous, update)) {
            return; // Attribute value did not change.
          }
          this[VALUES][key] = update;
          if (initialized) {
            // Prevent dispatch any events until constructor finishes.
            this.dispatchEvent(new ChangeEvent(key));
          }
        };
        if (constant) {
          if (key in defaults) {
            setter.call(this, defaults[key]);
            delete defaults[key]; // Do not set second time during further assign process.
          } else {
            throw new Error(`Uninitialized constant attribute ${path}`);
          }
        } else {
          descriptors[key].set = setter;
        }
      }
      Object.defineProperties(this, descriptors);
    }

    Object.assign(this, defaults, initials);
    initialized = true; // Let setters dispatch events from now on.
  }

  /**
   * Get unique model identifier.
   *
   * @method
   * @name Model#getUniqueId
   * @return {String}
   */
  getUniqueId () {
    return this[ID];
  }

  /**
   * Get model identifier.
   *
   * @method
   * @name Model#getId
   * @return {*}
   */
  getId () {
    return this.id;
  }

  /**
   * Performs deep transactional update of this model, recursively calling
   * `update` method on stored objects if available.
   *
   * Fires change events for regular model properties as well as for model
   * attributes if their values change.
   *
   * Non-enumerable properties of `source` are ignored during update.
   *
   * @method
   * @name Model#update
   * @param {Object|Model} source Properties of this object are assigned to model.
   * @return {Model} Updated model.
   */
  update (source) {
    this.transaction(() => {
      for (let key in source) {
        let val = this[key];
        if (val && isFunction(val.update)) {
          val.update(source[key]); // Let object update itself.
        } else {
          if (VALUES in this && key in this[VALUES]) {
            this[key] = source[key]; // Model attribute handles updates.
          } else {
            if (Object.is(val, source[key])) {
              continue; // No changes of regular property.
            }
            this[key] = source[key];
            this.dispatchEvent(new ChangeEvent(key));
          }
        }
      }
    });
    return this;
  }
}
