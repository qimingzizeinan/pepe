import 'reflect-metadata'
import electron from 'electron'
import type { BrowserWindow } from 'electron'

const PARAMTYPES_METADATA = 'design:paramtypes'
const DEFAULT_WINDOW_NAME = 'main'
const INJECTABLE = Symbol('injectable')
const WINDOW_INSTANCE = Symbol('window_instance')
const WINDOW_TYPE = Symbol('window')

type Constructor<T = any> = new (...args: any[]) => T

interface WindowOpts {
  name: string
  win: BrowserWindow
}

export function Injectable(name: `${string}Class`) {
  if (!name) {
    throw new Error('Injectable name is required')
  }

  return target => {
    Reflect.defineMetadata(INJECTABLE, name, target)
  }
}

export function WindowInstance(name = DEFAULT_WINDOW_NAME) {
  return (target, _, index) => {
    const param = Reflect.getMetadata(PARAMTYPES_METADATA, target)[index]
    Reflect.defineMetadata(INJECTABLE, WINDOW_TYPE, param)
    Reflect.defineMetadata(WINDOW_INSTANCE, name, param)
  }
}

export function Controller() {
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  return _ => {}
}

export async function initSDI(window: WindowOpts, controllers: Constructor[]) {
  const depMap = new Map<string, Constructor>()
  const windows: WindowOpts[] = []

  await electron.app.whenReady()

  windows.push(window)

  function factory(constructor: Constructor) {
    const paramtTypes = Reflect.getMetadata(PARAMTYPES_METADATA, constructor)
    let providers = []

    try {
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
    } catch (error) {
      console.log(error)
    }

    try {
      return new constructor(...providers)
    } catch (error) {
      console.log('111')
    }
  }
  for (const controller of controllers) {
    factory(controller)
  }
}
