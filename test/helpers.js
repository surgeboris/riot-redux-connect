import * as riot from 'riot';

let nextTagNumber = 1;

export function mountTestTag(html, fn, opts) {
  const tagName = `test-tag${nextTagNumber}`;
  ++nextTagNumber;
  riot.tag(tagName, html, '', '', fn);
  const el = document.createElement('div');
  document.body.append(el);
  return riot.mount(el, tagName, opts)[0];
}

export function addTestMixins(riot) {
  riot.mixin({
    countUpdates() {
      this.mixin({
        init() {
          this.numberOfUpdates = 0;
          this.on('updated', () => this.numberOfUpdates++);
        },
        countUpdatesDuringCall(fn, ...args) {
          const before = this.numberOfUpdates;
          fn(...args);
          const after = this.numberOfUpdates;
          return after - before;
        }
      });
    }
  });
}

export function simulateClick(el) {
  var event = document.createEvent('HTMLEvents');
  event.initEvent('click', false, true);
  el.dispatchEvent(event);
}
