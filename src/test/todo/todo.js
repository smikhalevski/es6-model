import isString from 'lodash/lang/isString';
import isBoolean from 'lodash/lang/isBoolean';
import pull from 'lodash/array/pull';
import Model from '../../main/js/Model';
import List from '../../main/js/List';
import {assert, nested} from '../../main/js/ChainableDescriptor';
import React, {Component, PropTypes} from 'react';

const ALL = 'all';
const ACTIVE = 'active';
const COMPLETED = 'completed';

class TodoModel extends Model {
  static attributes = {
    text: assert(isString),
    done: assert(isBoolean)
  };
}

class TodoAppModel extends Model {
  static attributes = {
    todos: nested(List.of(TodoModel)).defaultValue([]),
    filter: assert(filter => [ALL, ACTIVE, COMPLETED].includes(filter))
  };

  removeTodo(todo) {
    pull(this.todos, todo);
  }

  addTodo(todo) {
    this.todos.push(todo);
  }
}

class Todo extends Component {
  static propTypes = {
    record: PropTypes.isInstanceOf(TodoModel)
  };

  render() {
    let {text, done} = this.props.record;
    return (
      <li style={{textDecoration: done ? 'line-through' : 'none'}}>{text}</li>
    );
  }
}

class Todo extends Component {
  static propTypes = {
    record: PropTypes.isInstanceOf(TodoModel)
  };

  render() {
    let {text, done} = this.props.record;
    return (
      <li style={{textDecoration: done ? 'line-through' : 'none'}}>{text}</li>
    );
  }
}