import MutationEvent from './MutationEvent';

export default class RemoveEvent extends MutationEvent {

  constructor (model) {
    super();
    this.model = model;
  }
}
