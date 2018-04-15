import * as riot from 'riot';
import riotReduxConnect from '../index.js';
import { addTestMixins, mountTestTag, simulateClick } from './helpers.js';
import {
  store, createUpdateStoreAction,
  updateStore, resetStore
} from './store.js';

addTestMixins(riot);
riotReduxConnect(riot, store);

const defaultState = { part1: 'foo1', part2: 'bar1' };

function getTagInstance({
  tagHtml = `
    <div ref="derived1">{opts.derivedValue1}</div>
    <div ref="derived2">{opts.derivedValue2}</div>
    <button ref="change_btn" onclick={change} />
    <button ref="reset_btn" onclick={reset} />
  `,
  mapStateToOptions = ({ part1, part2 }) => ({
    derivedValue1: `${part1}+${part2}`,
    derivedValue2: `${part1}x${part2}`,
  }),
  mapDispatchToMethods = {
    change: () => createUpdateStoreAction({ part1: 'foo2', part2: 'bar2' }),
    reset: () => createUpdateStoreAction(defaultState),
  },
  connectConfig = {},
  tagOpts,
} = {}) {
  function tagScript() {
    this.reduxConnect(
      mapStateToOptions,
      mapDispatchToMethods,
      connectConfig
    );
    this.countUpdates();
  };
  return mountTestTag(tagHtml, tagScript, tagOpts);
}

describe('riot-redux-connect', () => {
  let tagInstance;

  function resetTestSetup(
    newTagInstanceConfig = {},
    newState = defaultState,
  ) {
    updateStore(newState);
    tagInstance = getTagInstance(newTagInstanceConfig);
  };

  afterEach(() => {
    tagInstance.unmount();
    resetStore();
  });

  test('merges state-derived values with the tag opts on tag initialization', () => {
    resetTestSetup();
    expect(tagInstance.refs.derived1.innerHTML).toBe('foo1+bar1');
    expect(tagInstance.refs.derived2.innerHTML).toBe('foo1xbar1');
  });

  test('assigns dispatch-wrapped action-creator methods to the tag instance', () => {
    resetTestSetup();
    expect(typeof tagInstance.change).toBe('function');
    expect(typeof tagInstance.reset).toBe('function');
  });

  test('avoids updating the tag when unrelated part of store changed', () => {
    resetTestSetup();
    const numberOfUpdates = tagInstance.countUpdatesDuringCall(
      updateStore, { unrelated: {} }
    );
    expect(numberOfUpdates).toBe(0);
  });

  test('updates derived values automatically on any (even extraneous) store change', () => {
    resetTestSetup();
    const numberOfUpdates = tagInstance.countUpdatesDuringCall(
      updateStore, { part1: 'changed1', part2: 'changed2' }
    );
    expect(tagInstance.refs.derived1.innerHTML).toBe('changed1+changed2');
    expect(tagInstance.refs.derived2.innerHTML).toBe('changed1xchanged2');
    expect(numberOfUpdates).toBe(1);
  });

  test('prevents riot-update in actions by default', () => {
    resetTestSetup();
    const numberOfUpdates = tagInstance.countUpdatesDuringCall(
      simulateClick, tagInstance.refs.change_btn
    );
    expect(tagInstance.refs.derived1.innerHTML).toBe('foo2+bar2');
    expect(tagInstance.refs.derived2.innerHTML).toBe('foo2xbar2');
    expect(numberOfUpdates).toBe(1);
  });

  test('allows to granularly disable riot-update prevention in action-creator methods via an option', () => {
    resetTestSetup({
      connectConfig: { disablePreventUpdateFor: ['change'] },
    });
    const numberOfUpdatesOnChange = tagInstance.countUpdatesDuringCall(
      simulateClick, tagInstance.refs.change_btn
    );
    expect(numberOfUpdatesOnChange).toBe(2);
    const numberOfUpdatesOnReset = tagInstance.countUpdatesDuringCall(
      simulateClick, tagInstance.refs.reset_btn
    );
    expect(numberOfUpdatesOnReset).toBe(1);
  });

  test('avoids auto-updating the tag on state change if mapStateToOpts not used', () => {
    resetTestSetup({
      mapStateToOptions: null
    });
    const numberOfUpdates = tagInstance.countUpdatesDuringCall(
      simulateClick, tagInstance.refs.change_btn
    );
    expect(numberOfUpdates).toBe(0);
  });

  test('passes dispatch and tag instance as an arguments to the function passed as "mapDispatchToMethods" argument', () => {
    const mapDispatchToMethods = jest.fn().mockReturnValue({});
    resetTestSetup({ mapDispatchToMethods });
    const { mock: { calls } } = mapDispatchToMethods;
    expect(calls.length).toBe(1);
    expect(typeof calls[0][0]).toBe('function');
    expect(typeof calls[0][1]).toBe('object');
  });

  test('provides implicit customizable "dispatch" opt when there is no "mapDispatchToMethods" argument', () => {
    const implicitDispatchOptName = 'foobar';
    resetTestSetup({
      mapDispatchToMethods: null,
      connectConfig: { implicitDispatchOptName }
    });
    expect(typeof tagInstance.opts[implicitDispatchOptName]).toBe('function');
  });

  test('updates tag instance on customizable "redux-sync" event', () => {
    const reduxSyncEventName = 'foobar';
    resetTestSetup({
      mapStateToOptions({ itemsToPick }, tag) {
        return { derivedValue1: itemsToPick[tag.opts.item] };
      },
      connectConfig: { reduxSyncEventName },
      tagOpts: { item: 0 },
    }, { itemsToPick: ['foo', 'bar'] });
    expect(tagInstance.refs.derived1.innerHTML).toBe('foo');
    tagInstance.opts.item = 1;
    tagInstance.update();
    expect(tagInstance.refs.derived1.innerHTML).toBe('foo');
    tagInstance.trigger(reduxSyncEventName);
    expect(tagInstance.refs.derived1.innerHTML).toBe('bar');
  });

  test('throws error when trying to connect already connected tag', () => {
    resetTestSetup();
    expect(() => { tagInstance.reduxConnect(null, null) }).toThrow();
  });
});
