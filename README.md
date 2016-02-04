### <a name="#event-dispatcher"></a>`class EventDispatcher`





### <code>class Model extends <a href="#event-dispatcher">EventDispatcher</a></code>

#### <a name="model.constructor"></a>`new Model`

```javascript
new Model([object initilas])
```

Creates new `Model` instance updating it with values provided by optional `initials` object.

```javascript
let model = new Model({foo: 123});
console.log(model.foo) // → 123
```

#### `Model#getUniqueId()`

```javascript
string getUniqueId()
```

Returns unique model identifier. Serves same purpose as [Backbone.Model.cid](http://backbonejs.org/#Model-cid).

#### `Model#getId()`

```javascript
* getId()
```

Returns model identifier used to distinguish models in [`List`](#list). Serves same purpose as [Backbone.Model.cid](http://backbonejs.org/#Model-id). By default, returns `Model#id`, so if one is not defined as attribute or as a property, `undefined` is returned.

```javascript
let model = new Model();
model.id = 'abc';

console.log(model.getId()) // → abc
```

#### `Model#update()`

```javascript
void update(object source)
```

Performs deep transactional update of this model, recursively calling `update` method on stored objects if available. Transactional means that change events are dispatched when all fields from `source` are assigned to model, so listeners don't see partially updated model.

Triggers change events for regular model properties as well as for model attributes if their values change basing on `Object.is` comparison.

Non-enumerable properties of `source` are ignored during update.

```javascript
let model = new Model();

function changeListener(event) {
  console.log(`Changed ${event.key} to ${this[event.key]}`);
}
model.addEventListener(ChangeEvent, changeListener);

model.update({foo: 'bar'}); // → Changed foo to bar
```



### `interface Descriptor`

#### `Descriptor#get()`

```javascript
* get(* storedValue)
```

Optional attribute getter receives value that is currently being stored in model. Getter returns value that should be served to requester. By default, `get` returns `storedValue` as is.

```javascript
class UserModel extends Model {
  static attributes = {
    greeting: {
      get (storedValue) {
        return `Hello ${storedValue}!`;
      }
    }
  }
}

let user = new UserModel({greeting: 'Peter'});
console.log(user.greeting); // → Hello Peter!
```

#### <a name="#model.set"></a>`Descriptor#set()`

```javascript
* set(* value, storedValue)
```

Optional attribute setter receives value user inteneded to assign and value that is currently being stored in model. If `set` returns value that is not equal to `storedValue` then returned value is first stored in model and then instance of `ChangeEvent` is dispatched by model. Values are compared using `Object.is`. By default, `set` returns `value` as is.

```javascript
class FooModel extends Model {
  static attributes = {
    even: {
      set (value, storedValue) {
        return value + value % 2;
      }
    }
  }
}

let foo = new FooModel;

function changeListener(event) {
  console.log(`Even is set to ${foo.even}`);
}
foo.addEventListener(ChangeEvent, changeListener);
foo.even = 1; // → Even is set to 2

foo.even = 2; // Attribute did not change its value so no changes are dispatched
```

#### `Descriptor#default`

Attribute default value stored in model during instantiation. [Setter](#model.set) is used to assign value. This value can be overridden by initials provided to [model constructor](#model.constructor). By default is set to `undefined`.

If attribute descriptor has only `default` and default value is `undefined`, `null`, primitive or its wrapper, function or an array you can use shorthand sintax:

```javascript
class CarModel extends Model {
  static attributes = {
    brand: 'Porshe', // Shorthand sintax, same as {default: 'Porshe'}
    speed: {default: 250}
  }
}

let car = new CarModel({speed: 300});
console.log(`${car.brand} can drive ${car.speed} km/h`); // → Porshe can drive 300 km/h
```

#### `Descriptor#serializable`

Boolean flag that toggles attribute enumerability. By default is set to `true`.

```javascript
class UserModel extends Model {
  static attributes = {
    isActive: {
      default: false,
      serializable: false
    }
  }
}

let user = new UserModel({name: 'Johnny'});

console.log(JSON.stringify(user)); // → {"name":"Johnny"}
console.log(user.isActive); // → false
```

#### `Descriptor#constant`

If set to `true` prevents attribute from being changed after intantiation. If attribute value was not provided as `default` or among initials then `Error` is thrown.

```javascript
class UserModel extends Model {
  static attributes = {
    userId: {constant: true}
  }
}

let user = new UserModel({userId: 512});
user.userId = 128; // → TypeError: Cannot set property which has only a getter

new UserModel; // → Error: Uninitialized constant attribute UserModel[userId]
```

#### `Descriptor#required`

Boolean flag that toggles weather attribute accepts `null` and `undefined` values or not. By default is set to `false`.

```javascript
class FooModel extends Model {
  static attributes = {
    baz: {required: true}
  }
}

let foo = new FooModel({baz: 'Okaay'});
try {
  foo.baz = undefined; // → Error: Required attribute FooModel[baz] cannot be undefined
} catch(e) {
  console.log(foo.baz); // → Okaay
}
```
