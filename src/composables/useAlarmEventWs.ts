import { ref } from 'vue'
import { H5jsEvent } from '@/assets/js/h5jsevent.js'
import { GetAlarmEventStateCountApi } from '@/api/alarmEvent'
import { useAlarmStore } from '@/store/alarm'
import { useUserStore } from '@/store/user'

export const useAlarmEventWs = () => {
  const alarmStore = useAlarmStore()
  const userStore = useUserStore()
  const eventWS = ref<any>(null)

  const refreshCounts = async () => {
    if (!userStore.username) return
    try {
      const res = await GetAlarmEventStateCountApi(userStore.username)
      if (res.status === 200 && res.data.code === 0) {
        alarmStore.setStateCounts(res.data.result || {})
      }
    } catch (error) {
      console.warn('[useAlarmEventWs] refresh counts failed', error)
    }
  }

  const handleMessage = (event: string) => {
    try {
      const data = JSON.parse(event)
      const msg = data?.msg || data
      alarmStore.setLastEvent(msg)
      alarmStore.markRefresh()
      refreshCounts()
      if (msg?.popup && !alarmStore.popupVisible) {
        alarmStore.openPopup(1)
      }
    } catch (error) {
      console.warn('[useAlarmEventWs] parse message failed', error)
    }
  }

  const connect = () => {
    if (eventWS.value || !userStore.session) return
    try {
      const baseUrl = new URL(userStore.IPPORT || window.location.origin)
      const conf = {
        protocol: baseUrl.protocol,
        host: userStore.WSROOT,
        rootpath: '',
        apipath: '/uapi/v1/ws/alarmEvent',
        pbconf: {
          callback: handleMessage,
          userName: userStore.username
        },
        userdata: null,
        session: userStore.session,
        consolelog: 'false'
      }
      eventWS.value = new H5jsEvent(conf)
      eventWS.value.connect()
      refreshCounts()
    } catch (error) {
      console.warn('[useAlarmEventWs] connect failed', error)
    }
  }

  const disconnect = () => {
    if (eventWS.value) {
      eventWS.value.disconnect()
      eventWS.value = null
    }
  }

  return {
    connect,
    disconnect,
    refreshCounts
  }
}
