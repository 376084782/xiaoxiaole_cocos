import SceneNavigator from "../commonScripts/core/SceneNavigator";
import Progress from "../commonScripts/Progress";
import PopupManager from "../commonScripts/core/PopupManager";
import SocketManager from "./manager/SocketManager";
import Utils from "../commonScripts/utils/Utils";
import MathUtil from "../commonScripts/utils/MathUtil";
import AudioPlayer from "../commonScripts/core/AudioPlayer";
import GameManager from "./manager/GameManager";
import EventManager from "../commonScripts/core/EventManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SceneLoading extends cc.Component {
  @property(Progress)
  prg: Progress = null;

  @property(cc.Canvas)
  canvas: cc.Canvas = null;

  hiddenTime = 0;
  doResize() {
    let screenRatio = cc.winSize.height / cc.winSize.width;
    let designRatio =
      cc.Canvas.instance.designResolution.height /
      cc.Canvas.instance.designResolution.width;
    if (screenRatio < designRatio) {
      this.canvas.fitHeight = true;
      this.canvas.fitWidth = false;
    } else {
      this.canvas.fitHeight = false;
      this.canvas.fitWidth = true;
    }
  }
  onLoad() {
    this.doResize();
    document.addEventListener("resize", () => {
      this.doResize();
    });

    document.addEventListener("visibilitychange", () => {
      console.log("隐藏切换");
      if (document.visibilityState == "hidden") {
        this.hiddenTime = new Date().getTime(); //记录页面隐藏时间
      } else {
        let visibleTime = new Date().getTime();
        if ((visibleTime - this.hiddenTime) / 1000 > 10) {
          location.reload();
        } else {
          console.log("还没有到断开的时间,刷新一下页面显示");
          EventManager.emit("game/reloadAll");
        }
      }
    });
  }
  @property(sp.Skeleton)
  test: sp.Skeleton = null;
  @property(cc.Node)
  pos: cc.Node = null;
  async start() {
    cc.assetManager.getBundle("resources").loadDir(
      "/",
      (finish, total) => {
        let prg = finish / total;
        this.prg.progress = prg;
        this.prg.setTxt(`${Math.floor(prg * 100)}%`);
      },
      async e => {
        await GameManager.updateCoin();
        await SocketManager.init();
      }
    );
  }
}
