import { Injectable } from '@main/sdi/index'
console.log('Injectable', Injectable)

@Injectable('AppServiceClass')
export class AppService {
  constructor() {
    console.log('AppService')
  }
}
