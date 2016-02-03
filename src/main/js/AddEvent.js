import MutationEvent from './MutationEvent';

export default class AddEvent extends MutationEvent {

  constructor (model) {
    super();
    this.model = model;
  }
}
