# ES6 Model

An accessor-based approach to defining domain models for ES6 world.

The main idea is to make process of creating and mutating models and collections as transparent as possible.

## Contents

1. Example
2. API
  1. [`EventDispatcher`](#event-dispatcher)
    1. Event System
    2. Built-in Events
  2. [`Model`](#model)
    1. Attributes
    2. Fluent Descriptor API
      1. `then`
      2. `assert`
      3. `process`
      4. `construct`
      5. `propagate`
      6. `nested`
      6. `defaultValue`
      7. `isRequired`
      8. `isHidden`
      9. `isConstant`
  3. `List`
    1. Typed Lists
  4. Transactions
3. Preformance

## API

### Models

```javascript
class CarModel extends Model {
  static attributes = {
    brand: {}
  };
}
```

This snippet describes model class that has single attribute `brand`. When value of that attribute is changed by assignment operator an instance of `ChangeEvent` is being dispatched by `CarModel`.

```javascript
let car = new CarModel;

function changeListener(event) {
  console.log(`Changed ${event.key} to ${this[event.key]}`);
}
car.addEventListener(ChangeEvent, changeListener);

car.brand = 'Porshe'; // → Changed brand to Porshe
```

In the meantime assigning any other properties to this object would not trigger any events, because those properties are **unmanaged**. To trigger change events for both attributes and properties use `update` method:

```javascript
car.update({
  color: 'aubergine',
  brand: 'Lada'
});
// Order of events in this case is not guaranteed.
// → Changed color to aubergine
// → Changed brand to Lada
```

Attributes are inherited and can be overridden:

```javascript
class SportsCarModel extends CarModel {
  static attributes = {
    topSpeed: {default: 200}
  };
}

let sportsCar = new SportsCarModel;
sportsCar.addEventListener(ChangeEvent, changeListener);

console.log(sportsCar.topSpeed); // → 200

sportsCar.brand = 'Porshe'; // → Changed brand to Porshe
sportsCar.topSpeed = 320; // → Changed topSpeed to 320
```





##### <code>class Model extends <a href="#event-dispatcher">EventDispatcher</a></code>

Model that uses accessors to mutate its attributes and properties.

Attributes can be redefined.

Undefined, nulls, primitives and their wrappers, arrays and functions are treated as
default value if provided as attribute descriptor.

Constant attribute requires `default` to be explicitly specified or its value should
be among initials. Constant attribute cannot be set after model initialization.

Properties of `Model` instance can be *managed* and *unmanaged*. Managed properties are referenced as attributes and can be defined by static property `attributes` of particular model constructor:

<code>Model(initials)</code>

###### Members

<code>&lt;static&gt; {String} <b>attributes</b> = "attributes" </code>

Symbol ar name of model static property that holds attribute descriptors.

Accessed during construction of every instance of model class or its descendants.

###### Methods

<code>{String} <b>getUniqueId</b>()</code>

Get unique model identifier.

<code>{String} <b>getUniqueId</b>()</code>

Get model identifier.

<code>{Model} <b>update</b>(source)</code>
Performs deep transactional update of this model, recursively calling `update` method on stored objects if available.

Fires change events for regular model properties as well as for model attributes if their values change.

Non-enumerable properties of `source` are ignored during update.









Each attribute can be described by a descriptor object:

#### `Descriptor`

###### Methods

<code>{*} <b>get</b>(currentValue)</code>

> Value returned by this method is returned as a requested property value.
> 
> - `{*} currentValue`<br/> Current value stored in model.

<code>{*} <b>set</b>(value, currentValue)</code>

> Value returned by setter is stored in model.
> 
> - `{*} value`<br/> Value intended to assign.
> - `{*} currentValue`<br/> Current value stored in model.

###### Properties

| Name  | Type | Default | Description |
| --- | --- | --- | --- |
| `default` | `*` | `undefined` | Default value, assigned via setter at instantiation.  |
| `serializable` | `Boolean` | `true` | Should attribute be enumerable. |
| `constant` | `Boolean` | `false` | Can attribute be assigned after instantiation.  |
| `required` | `Boolean` | `false` | Does attibute permit assignment of `null` and `undefined` values. |
