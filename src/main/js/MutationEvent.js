export default class MutationEvent {

  target;
  relatedTarget;

  isPropagationStopped () {
    return false;
  }

  stopPropagation () {
    this.isPropagationStopped = () => true;
  }
}
