import { Injectable } from '@main/sdi/index'

@Injectable('AppServiceClass')
export class AppService {
  constructor() {
    console.log('AppService')
  }

  public getDelayTime(): number {
    return 2
  }
}
