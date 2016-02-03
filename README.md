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

### **`Model`**

`Model` extends `EventDispatcher` and intends to store properties as a regular object so you don't need to call special accessor method every time you want to change or retrieve an property value.

Properties of `Model` instance can be *managed* and *unmanaged*. Managed properties are referenced as attributes and can be defined by object stored in static property `attributes` of particular model constructor:

```javascript
class CarModel extends Model {
  static attributes = {
    brand: {}
  };
}
```

The snippet above describes model class that would have single attribute `brand`. When value of that attribute is changed via ssignment an instance of `ChangeEvent` is being dispatched by `CarModel`.

```javascript
var car = new CarModel;

function changeListener(event) {
  console.log(`Changed ${event.key} to ${this[event.key]}`);
}
car.addEventListener(ChangeEvent, changeListener);

car.brand = 'Porshe'; // → Changed brand to Porshe
```

In the meantime assigning any other properties to this object would not trigger any events, because those properties are **unmanaged**. To trigger change events for both attributes and properties use `update` method:

```javascript
car.update({color: 'aubergine'}); // → Changed color to aubergine
car.update({brand: 'Lada'}); // → Changed brand to Lada
```

Attributes are inherited and can be overridden:

```javascript
class SportsCarModel extends CarModel {
  static attributes = {
    topSpeed: {default: 200}
  };
}

let sportsCar = new SportsCarModel;
car.addEventListener(ChangeEvent, changeListener);

console.log(car.topSpeed); // → 200

car.brand = 'Porshe'; // → Changed brand to Porshe
car.topSpeed = 320; // → Changed topSpeed to 320
```

Each attribute is described by a descriptor which can have following properties:

**`get`** `function(currentValue)`

Getter function receives currently current attribute value as a sole parameter. Value returned by getter is returned as attribute value.

**`set`** `function(value, currentValue)`

Setter function receives value intended to be assigned to attribute and value that is currently stored in model. Value returned by setter is stored in model.

**`default`**

Default value, assigned by attribute setter at instantiation time.

**`serializable`**

Should attribute be enumerable.

**`constant`**

Can attribute be assigned after model instantiation. 

**`required`**

Does attibute accept `null` and `undefined` values.


