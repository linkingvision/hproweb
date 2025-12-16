<template>
  <div></div>
</template>

<script lang="ts" setup>
import { logoutApi } from '@/api/userApi';
import { useUserStore } from '@/store/user';
import { useStore } from '@/store';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const store = useStore();
const router = useRouter();

const logout = async () => {
  const res = await logoutApi();
  console.log(res)
  if (res.status == 200 && res.data.code == 200) {
    sessionStorage.removeItem('session')
    store.setSidebarShow(false);
    userStore.setSession('')
    userStore.setSetIntervalKeepAlive(null);
    document.body.className = '';
    router.push('/login');
  }
}

onMounted(() => {
  logout();
})

</script>