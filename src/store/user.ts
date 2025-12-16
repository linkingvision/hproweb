import { defineStore } from "pinia";
import { ref, computed } from 'vue';

export const useUserStore = defineStore('userStore', () =>{
  const session = ref<string | null>(null);
  function setSession(newToken: string) {
    session.value = newToken;
  }

  const Access_token = ref<string | null>(null);
  function setAccess_token(value: string) {
    Access_token.value = value;
  }

  const setIntervalKeepAlive = ref<any>(null)
  function setSetIntervalKeepAlive(Interval: any) {
    if (Interval) {
      setIntervalKeepAlive.value = Interval;
    } else {
      clearInterval(setIntervalKeepAlive.value);
      setIntervalKeepAlive.value = null;
    }
  }

  const username = ref<string>('')
  function setUsername(name: string) {
    username.value = name;
  }

  const IPPORT = ref<string>('');
  function setIPPORT(value: string) {
    IPPORT.value = value;
  }

  const WSROOT = ref<string>('');
  function setWSROOT(value: string) {
    WSROOT.value = value;
  }

  return {
    session,
    setSession,
    Access_token,
    setAccess_token,
    setIntervalKeepAlive,
    setSetIntervalKeepAlive,
    username,
    setUsername,
    IPPORT,
    setIPPORT,
    WSROOT,
    setWSROOT
  }
}, {
  persist: {
    key: 'userStorage',
    storage: sessionStorage
  }
})