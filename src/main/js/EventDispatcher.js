export const LISTENERS = Symbol('listeners');

/**
 * @class EventDispatcher
 * @classdesc
 * Gives the ability to manage and dispatch custom named events.
 */
export default class EventDispatcher {

  constructor () {
    this[LISTENERS] = new Map;
  }

  /**
   * Register an event listener of a specific event type.
   *
   * @method
   * @name EventDispatcher#addEventListener
   * @param {...Function} classes Classes of events to add listener to.
   * @param {Function} listener Listener that receives a notification when
   *        an event of the specified type is being dispatched.
   */
  addEventListener (...classes) {
    let listener = classes.pop();
    if (listener instanceof Function) {
      for (let Class of classes) {
        if (Class instanceof Function) {
          let set = this[LISTENERS].get(Class);
          if (set) {
            set.add(listener);
          } else {
            this[LISTENERS].set(Class, new Set([listener]));
          }
        }
      }
    }
  }

  /**
   * Removes an event listener.
   *
   * If no event types are provided, listener is removed from all types
   * of events registered for object at runtime.
   *
   * @method
   * @name EventDispatcher#removeEventListener
   * @param {...Function} [classes] Classes of events to remove listener from.
   * @param {Function} listener Listener to remove from the event target.
   */
  removeEventListener (...classes) {
    let listener = classes.pop();
    if (classes.length === 0) {
      classes = this[LISTENERS].keys();
    }
    for (let Type of classes) {
      let set = this[LISTENERS].get(Type);
      if (set) {
        set.delete(listener);
      }
    }
  }

  /**
   * Dispatch an event notifying listeners appropriate for provided event.
   *
   * @method
   * @name EventDispatcher#dispatchEvent
   * @param {Object} event Event to dispatch.
   */
  dispatchEvent (event) {
    if (!event.hasOwnProperty('target')) {
      event.target = this;
    }
    let listeners = [];
    for (let Class of this[LISTENERS].keys()) {
      if (event instanceof Class) {
        for (let listener of this[LISTENERS].get(Class)) {
          if (listeners.includes(listener)) {
            continue; // Listener has been invoked during dispatch of this event.
          }
          listener.call(this, event);
          listeners.push(listener);
        }
      }
    }
  }

  /**
   * Invokes callback in transaction, causing events to wait until callback finishes,
   * and dispatches them on successful competition.
   *
   * @method
   * @name EventDispatcher#transaction
   * @param {Function} callback Transaction callback.
   */
  transaction (callback) {
    let events = [];
    this.dispatchEvent = event => events.push(event);
    try {
      callback.call(this);
    } finally {
      delete this.dispatchEvent;
    }
    for (let event of events) {
      this.dispatchEvent(event);
    }
  }
}
