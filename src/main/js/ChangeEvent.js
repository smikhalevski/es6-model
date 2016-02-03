import MutationEvent from './MutationEvent';

export default class ChangeEvent extends MutationEvent {

  constructor (key) {
    super();
    this.key = key;
  }
}
