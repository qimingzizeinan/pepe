import { ipcInstance } from '@renderer/ipc'

export function sendMsgToMainProcess(msg: string) {
  return ipcInstance.send<string>('send-msg', msg)
}
