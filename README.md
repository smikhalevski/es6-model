# es6-model
An accessor-based approach to defining domain models for ES6 world.

Example:

```
import {Model, List, assert, nested, isRequired, defaultValue} from 'es6-model';

class Permission extends Model {
  static attributes = {
    id: assert(Number.isNumber).isRequired()
  };

  getPermissionId () {
    return `perm${this.id}`;
  }
}

class Role extends Model {
  static attributes = {
    permissions: nested(List.of(Permission))
  };
}

class AdministratorRole extends Role {}

class User extends Model {
  static attributes = {
    firstName: isRequired(),
    active: defaultValue(false).notSerializable(),
    role: nested(Role)
  };
}

class Manager extends User {
  static attributes = {
    role: defaultValue(new AdministratorRole).isConstant(),
    subordinates: nested(List.of(User))
  };
}

let user = new Manager;
user.firstName = 'Peter Griffin';
user.subordinates = [
  {
    firstName: 'Meg Griffin',
    role: {
      permissions: [
        {id: 123}
      ]
    }
  }
];

user.subordinates[0].role.permissions[0].getPermissionId() // -> 'perm123'
```