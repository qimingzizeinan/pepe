import 'reflect-metadata'
import electron from 'electron'
import type { BrowserWindow } from 'electron'

const PARAMTYPES_METADATA = 'design:paramtypes'
const DEFAULT_WINDOW_NAME = 'main'
const INJECTABLE = Symbol('injectable')
const WINDOW_INSTANCE = Symbol('window_instance')
const WINDOW_TYPE = Symbol('window')
// ipc注入
const IPC_HANDLE = Symbol('ipc_handle')
const IPC_SEND = Symbol('ipc_send')
const IPC_ON = Symbol('ipc_on')

const IPC_SEND_WIN_NAME = Symbol('ipc_send_win')

type Constructor<T = any> = new (...args: any[]) => T

interface WindowOpts {
  name: string
  win: BrowserWindow
}

// renderer调用处理
export function IpcHandle(channel) {
  if (!channel) {
    throw new Error('ipc handle channel is required')
  }

  return (target, propertyName) => {
    Reflect.defineMetadata(IPC_HANDLE, channel, target, propertyName)
  }
}

// ipc调用监听
export function IpcOn(channel) {
  if (!channel) {
    throw new Error('ipc on channel is required')
  }

  return (target, propertyName) => {
    Reflect.defineMetadata(IPC_ON, channel, target, propertyName)
  }
}

// ipc调用发送
export function IpcSend(channel, windowName = DEFAULT_WINDOW_NAME) {
  if (!channel) {
    throw new Error('ipc send channel is required')
  }

  return (target, propertyName) => {
    Reflect.defineMetadata(IPC_SEND, channel, target, propertyName)
    Reflect.defineMetadata(IPC_SEND_WIN_NAME, windowName, target, propertyName)
  }
}

// service注入
export function Injectable(name: `${string}Class`) {
  if (!name) {
    throw new Error('Injectable name is required')
  }

  return target => {
    Reflect.defineMetadata(INJECTABLE, name, target)
  }
}

// windows实例注入
export function WindowInstance(name = DEFAULT_WINDOW_NAME) {
  return (target, _, index) => {
    const param = Reflect.getMetadata(PARAMTYPES_METADATA, target)[index]
    Reflect.defineMetadata(INJECTABLE, WINDOW_TYPE, param)
    Reflect.defineMetadata(WINDOW_INSTANCE, name, param)
  }
}

// controller注入
export function Controller() {
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  return _ => {}
}

// 初始化
export async function initSDI(window: WindowOpts, controllers: Constructor[]) {
  const depMap = new Map<string, Constructor>()
  const windows: WindowOpts[] = []

  await electron.app.whenReady()

  windows.push(window)

  function factory(constructor: Constructor) {
    const paramtTypes = Reflect.getMetadata(PARAMTYPES_METADATA, constructor)
    let providers = []

    if (paramtTypes) {
      providers = paramtTypes.map((provider, index) => {
        const injectType = Reflect.getMetadata(INJECTABLE, provider)

        if (injectType === WINDOW_TYPE) {
          const name = Reflect.getMetadata(WINDOW_INSTANCE, provider)
          const winOpt = windows.find(item => item.name === name)
          if (!winOpt) {
            throw new Error(`${name} is not provided to inject`)
          }

          return winOpt.win
        } else if (injectType.endsWith('Class')) {
          const { name } = provider
          const cache = depMap.get(name) || factory(provider)
          return cache
        } else {
          throw new Error(
            `${constructor.name}'s parameter [${index}] is not injectable`,
          )
        }
      })
    }
    // console.log('providers', new constructor(...providers))
    return new constructor(...providers)
  }
  for (const controller of controllers) {
    const controllerInstance = factory(controller)

    const proto = Object.getPrototypeOf(controllerInstance)

    const funcs = Object.getOwnPropertyNames(proto).filter(
      item =>
        typeof controllerInstance[item] === 'function' &&
        item !== 'constructor',
    )
    funcs.forEach(func => {
      if (Reflect.getMetadata(IPC_HANDLE, proto, func)) {
        const channel = Reflect.getMetadata(IPC_HANDLE, proto, func)
        electron.ipcMain.handle(channel, async (e, ...args) => {
          try {
            const result = await controllerInstance[func].apply(
              controllerInstance,
              [...args, e],
            )
            return {
              data: result,
            }
          } catch (error) {
            return {
              data: null,
              error,
            }
          }
        })
      } else if (Reflect.getMetadata(IPC_ON, proto, func)) {
        const channel = Reflect.getMetadata(IPC_ON, proto, func)
        electron.ipcMain.on(channel, async (e, ...args) => {
          try {
            await controllerInstance[func].apply(controllerInstance, [
              ...args,
              e,
            ])
          } catch (error) {
            console.error('ipc on error', error)
          }
        })
      } else if (Reflect.getMetadata(IPC_SEND, proto, func)) {
        const channel = Reflect.getMetadata(IPC_SEND, proto, func)
        const winName = Reflect.getMetadata(IPC_SEND_WIN_NAME, proto, func)
        const winInfo = windows.find(item => item.name === winName)
        if (winInfo) {
          const { webContents } = winInfo.win
          const tempFun = controllerInstance[func]
          controllerInstance[func] = async (...args) => {
            const result = await tempFun.apply(controllerInstance, args)
            webContents.send(channel, result)
            return result
          }
        } else {
          console.error(`ipc send error: Can not find window ${winName} `)
        }
      }
    })
  }
}
