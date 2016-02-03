import MutationEvent from './MutationEvent';

export default class SortEvent extends MutationEvent {

  constructor (model, oldIndex) {
    super();
    this.model = model;
    this.oldIndex = oldIndex;
  }
}
