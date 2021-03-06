import { createStore, applyMiddleware } from 'redux';
import reduxThunk from 'redux-thunk';

const UPDATE_STATE_ACTION = 'TEST/UPDATE_STATE';
const RESET_STATE_ACTION = 'TEST/RESET_STATE';

function rootReducer(state = {}, action) {
  if (action.type === UPDATE_STATE_ACTION) {
    return Object.assign({}, state, action.update);
  }
  if (action.type === RESET_STATE_ACTION) {
    return {};
  }
  return state;
}

export const store = createStore(rootReducer, applyMiddleware(reduxThunk));

const identityFn = _ => _;
export function getServerSideStore(preloadedState) {
  return  createStore(identityFn, preloadedState);
}

export function createUpdateStoreAction(update) {
  return { type: UPDATE_STATE_ACTION, update };
}

export function updateStore(upd) {
  store.dispatch(createUpdateStoreAction(upd));
}

export function resetStore() {
  store.dispatch({ type: RESET_STATE_ACTION });
}
