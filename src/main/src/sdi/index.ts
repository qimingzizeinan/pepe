import 'reflect-metadata'
// const PARAMTYPES_METADATA = 'design:paramtypes'
const INJECTABLE = Symbol('injectable')
type Constructor<T = any> = new (...args: any[]) => T

// const depMap = new Map<string, Constructor>()

export function Injectable(name: `${string}Class`) {
  console.log('Injectable')
  if (!name) {
    throw new Error('Injectable name is required')
  }

  return target => {
    Reflect.defineMetadata(INJECTABLE, name, target)
  }
}

export function Controller() {
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  return _ => {}
}

export function factory(constructor: Constructor) {
  console.log('constructor', constructor)
  // const paramtTypes = Reflect.getMetadata(PARAMTYPES_METADATA, constructor)

  const result = Reflect.getMetadata('design:paramtypes', constructor)
  console.log('result', result)
}

export function initSDI(controllers: Constructor[]) {
  console.log('1controller', controllers)
  for (const controller of controllers) {
    factory(controller)
  }
}
