<script setup lang="ts">
import { useRequest } from '@renderer/hooks'
import { getAddrs } from '@renderer/api/index'
import { getUserList } from '@renderer/api/mock'
import { sendMsgToMainProcess } from '@renderer/api/ipc'
import { useIpc } from '@renderer/ipc'
import { ref } from 'vue'
const { data, loading, run, runParams } = useRequest(getAddrs, {
  apiKey: import.meta.env.VITE_APP_KEY,
})
console.log(data, loading, run)
const handleAgainRequest = () => {
  // 手动调用
  runParams({ apiKey: import.meta.env.VITE_APP_KEY })
}
getUserList()

const log = ref('')
const msg = ref('')
const sendMsg = async () => {
  try {
    log.value += `[render]: ${msg.value} \n`
    const { data } = await sendMsgToMainProcess(msg.value)
    log.value += `[main]: ${data}  \n`
  } catch (error) {
    console.error(error)
  }
}
const ipc = useIpc()

ipc.on('reply-msg', (msg: string) => {
  log.value += `[main]: ${msg}  \n`
})
</script>

<template>
  <!-- 请求 -->
  <el-button type="primary" size="small" @click="handleAgainRequest">
    重新请求
  </el-button>

  <div>{{ loading }}</div>
  <div>{{ data }}</div>

  <div>ipc调用</div>
  <div>
    <textarea v-model="log" cols="60" rows="10" disabled />
    <div style="margin-top: 20px">
      <input v-model="msg" type="text" placeholder="send msg to main process" />
      <button style="margin-left: 20px" @click="sendMsg">Send</button>
    </div>
  </div>
</template>

<style scoped></style>
