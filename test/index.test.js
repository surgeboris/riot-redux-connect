import * as riot from 'riot';
import riotReduxConnect from '../index.js';
import { addTestMixins, mountTestTag, simulateClick } from './helpers.js';
import {
  store, createUpdateStoreAction,
  updateStore, resetStore
} from './store.js';

addTestMixins(riot);
riotReduxConnect(riot, store);

describe('riot-redux-connect', () => {
  let tagInstance;
  beforeAll(() => {
    resetStore();
    const defaultState = { part1: 'foo1', part2: 'bar1' };
    updateStore(defaultState);
    tagInstance = mountTestTag(
      `
        <div ref="derived1">{opts.derivedValue1}</div>
        <div ref="derived2">{opts.derivedValue2}</div>
        <button ref="change_btn" onclick={change} />
      `,
      function() {
        this.reduxConnect(
          ({ part1, part2 }) => ({
            derivedValue1: `${part1}+${part2}`,
            derivedValue2: `${part1}x${part2}`,
          }),
          {
            change(e) {
              e.preventUpdate = true;
              return createUpdateStoreAction({ part1: 'foo2', part2: 'bar2' });
            },
            reset(e) {
              e.preventUpdate = true;
              return createUpdateStoreAction(defaultState);
            }
          }
        );
        this.countUpdates();
      }
    );
  });
  afterAll(() => {
    tagInstance.unmount();
    resetStore();
  });

  test('merges state-derived values with the tag opts on tag initialization', () => {
    expect(tagInstance.refs.derived1.innerHTML).toBe('foo1+bar1');
    expect(tagInstance.refs.derived2.innerHTML).toBe('foo1xbar1');
  });

  test('assigns dispatch-wrapped action-creator methods to the tag instance', () => {
    expect(typeof tagInstance.change).toBe('function');
    expect(typeof tagInstance.reset).toBe('function');
  });

  test('avoids updating the tag when unrelated part of store changed', () => {
    const before = tagInstance.numberOfUpdates;
    updateStore({ unrelated: {} });
    const after = tagInstance.numberOfUpdates;
    expect(after).toEqual(before);
  });

  test('updates derived values automatically on any (even extraneous) store change', () => {
    updateStore({ part1: 'changed1', part2: 'changed2' });
    expect(tagInstance.refs.derived1.innerHTML).toBe('changed1+changed2');
    expect(tagInstance.refs.derived2.innerHTML).toBe('changed1xchanged2');
  });

  test('enables riot tags to employ basic redux workflow', () => {
    simulateClick(tagInstance.refs.change_btn);
    expect(tagInstance.refs.derived1.innerHTML).toBe('foo2+bar2');
    expect(tagInstance.refs.derived2.innerHTML).toBe('foo2xbar2');
  });
});

describe('riot-redux-connect', () => {
  let tagInstance;
  beforeAll(() => {
    resetStore();
    tagInstance = mountTestTag(
      `<button ref="act_btn" onclick="{reset}">Act</div>`,
      function() {
        this.reduxConnect(
          null,
          {
            reset(e) {
              e.preventUpdate = true;
              return createUpdateStoreAction({ acted: true })
            }
          },
        );
        this.countUpdates();
      }
    );
  });
  afterAll(() => {
    tagInstance.unmount();
    resetStore();
  });

  test('avoids auto-updating the tag on state change if mapStateToOpts not used', () => {
    const before = tagInstance.numberOfUpdates;
    simulateClick(tagInstance.refs.act_btn);
    const after = tagInstance.numberOfUpdates;
    expect(before).toEqual(after);
  });
});

describe('riot-redux-connect', () => {
  let tagInstance;
  let mapDispatchToMethods;
  beforeAll(() => {
    resetStore();
    mapDispatchToMethods = jest.fn().mockReturnValue({});
    tagInstance = mountTestTag(
      ``,
      function() {
        this.reduxConnect(
          null,
          mapDispatchToMethods,
        );
      }
    );
  });
  afterAll(() => {
    tagInstance.unmount();
    resetStore();
  });

  test('passes dispatch and tag instance as an arguments to the function passed as "mapDispatchToMethods" argument', () => {
    const { mock: { calls } } = mapDispatchToMethods;
    expect(calls.length).toBe(1);
    expect(typeof calls[0][0]).toBe('function');
    expect(typeof calls[0][1]).toBe('object');
  });
});

describe('riot-redux-connect', () => {
  let tagInstance;
  const implicitDispatchOptName = 'foobar';
  beforeAll(() => {
    resetStore();
    tagInstance = mountTestTag(
      ``,
      function() {
        this.reduxConnect(
          null,
          null,
          { implicitDispatchOptName }
        );
      }
    );
  });
  afterAll(() => {
    tagInstance.unmount();
    resetStore();
  });

  test('provides implicit customizable "dispatch" opt when there is no "mapDispatchToMethods" argument', () => {
    expect(typeof tagInstance.opts[implicitDispatchOptName]).toBe('function');
  });
});

describe('riot-redux-connect', () => {
  let tagInstance;
  beforeAll(() => {
    resetStore();
    updateStore({ itemsToPick: ['foo', 'bar'] });
    tagInstance = mountTestTag(
      `<div ref="derived">{opts.picked}</div>`,
      function() {
        this.reduxConnect(
          ({ itemsToPick }, tag) => ({ picked: itemsToPick[tag.opts.item] }),
          null,
        );
      },
      { item: 0 },
    );
  });
  afterAll(() => {
    tagInstance.unmount();
    resetStore();
  });

  test('updates tag instance on "redux-sync" event', () => {
    expect(tagInstance.refs.derived.innerHTML).toBe('foo');
    tagInstance.opts.item = 1;
    tagInstance.update();
    expect(tagInstance.refs.derived.innerHTML).toBe('foo');
    tagInstance.trigger("redux-sync");
    expect(tagInstance.refs.derived.innerHTML).toBe('bar');
  });
});
