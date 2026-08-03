/**
 * Vuex-compatible shim for legacy JS files (e.g. h5mapjs.js) that do
 *   import store from '../../store'
 *   store.state.IPPORT
 * Pinia doesn't have a default export, so this shim bridges the gap.
 */
import { useUserStore } from './user'

const legacyStore = {
  get state() {
    return {
      get IPPORT() {
        try { return useUserStore().IPPORT } catch { return '' }
      },
    }
  },
}

export default legacyStore
