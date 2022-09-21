import { Controller, IpcHandle, IpcSend, WindowInstance } from '@main/sdi/index'
import { AppService } from '@main/services/index'
import { app, BrowserWindow } from 'electron'

@Controller()
export class AppController {
  constructor(
    private appService: AppService,
    @WindowInstance() private win: BrowserWindow,
  ) {}

  @IpcSend('reply-msg')
  public replyMsg(msg: string) {
    return msg
  }

  @IpcHandle('send-msg')
  public sendMsg(msg: string) {
    console.log(msg)
    setTimeout(() => {
      this.replyMsg(msg)
    }, this.appService.getDelayTime() * 1000)
    return 'Get msg'
  }

  @IpcHandle('exit')
  public exit() {
    app.quit()
  }
}
