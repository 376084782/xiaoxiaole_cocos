import SocketManager from "../manager/SocketManager";
import AudioPlayer from "../../commonScripts/core/AudioPlayer";
import PromiseUtil from "../../commonScripts/utils/PromiseUtil";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameRoundTxtPlayer extends cc.Component {
  @property(sp.Skeleton)
  ani: sp.Skeleton = null;

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {}

  start() {
    this.node.active = false;
  }
  lastRound = 0;
  lastSeat = 0;
  doPlay() {
    let round = SocketManager.matchInfo.round;
    let seat = SocketManager.powerSeat;
    if (round == this.lastRound && seat == this.lastSeat) {
      return;
    }
    this.node.active = true;
    this.ani.setSlotsToSetupPose();
    let roundAni = round;
    if (roundAni > 4) {
      roundAni = 4;
    }
    this.ani.setAnimation(
      1,
      `huihe${round == this.lastRound ? 0 : roundAni}_${seat == 1 ? "L" : "H"}`,
      false
    );
    if (round != this.lastRound) {
      let map = ["", "一", "二", "三", "四"];
      AudioPlayer.playEffectByUrl(`sound/第${map[round]}回合播报音效`);
      PromiseUtil.wait(2).then(e => {
        if (seat == 1) {
          AudioPlayer.playEffectByUrl("sound/你的回合播报音效");
        } else {
          AudioPlayer.playEffectByUrl("sound/对方回合播报音效");
        }
      });
    } else {
      if (seat == 1) {
        AudioPlayer.playEffectByUrl("sound/你的回合播报音效");
      } else {
        AudioPlayer.playEffectByUrl("sound/对方回合播报音效");
      }
    }
    this.lastRound = round;
    this.lastSeat = seat;
  }

  // update (dt) {}
}
