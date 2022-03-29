import PromiseUtil from "../../commonScripts/utils/PromiseUtil";
import RoundLight from "./RoundLight";
import MissionPrg from "./MissionPrg";
import SocketManager from "../manager/SocketManager";
import GameTurnTimePrg from "./GameTurnTimePrg";
import EventManager from "../../commonScripts/core/EventManager";
import AudioPlayer from "../../commonScripts/core/AudioPlayer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameBarCenter extends cc.Component {
  @property(RoundLight)
  aniLight: RoundLight = null;

  @property(MissionPrg)
  prgLan: MissionPrg = null;
  @property(MissionPrg)
  prgHong: MissionPrg = null;

  @property(cc.Node)
  lightL: cc.Node = null;

  @property(cc.Node)
  lightH: cc.Node = null;

  @property(GameTurnTimePrg)
  prgTime: GameTurnTimePrg = null;

  onDestroy() {
    EventManager.remove("game/goNextRound");
  }
  start() {
    EventManager.on("game/goNextRound", e => {
      this.setPrg(1, SocketManager.selfData.skillPrg);
      this.setPrg(2, SocketManager.oppoData.skillPrg);
    });
  }
  resetAll() {
    this.lightL.active = false;
    this.lightH.active = false;
    this.aniLight.resetAll();
    this.prgLan.type = SocketManager.selfData.gridType;
    this.prgHong.type = SocketManager.oppoData.gridType;
    this.prgLan.propId = SocketManager.selfData.propId;
    this.prgHong.propId = SocketManager.oppoData.propId;
  }
  async aniShow() {
    await this.setPrg(1, SocketManager.selfData.skillPrg);
    await this.setPrg(2, SocketManager.oppoData.skillPrg);

    AudioPlayer.playEffectByUrl("sound/开局展示道具特效音效");
    this.prgLan.showCard();
    await PromiseUtil.wait(0.4);
    this.prgHong.showCard();

    await PromiseUtil.wait(1);
    AudioPlayer.playEffectByUrl("sound/开局道具展示特效展示完回去音效");
    this.prgLan.hideCard();
    this.prgHong.hideCard();
    await PromiseUtil.wait(1);
    this.aniLight.number = 5 - SocketManager.matchInfo.turn;
    this.prgTime.reset();
    await this.aniLight.resetNumber();

    this.aniLight.resetAll();
    this.changeRound(
      SocketManager.matchInfo.round,
      SocketManager.matchInfo.turn,
      true
    );
  }

  async setPrg(color, num) {
    let prg = color == 1 ? this.prgLan : this.prgHong;
    await prg.setCurrent(num);
  }
  lastRound = 0;
  changeRound(round: number, turn: number, flagMust = false) {
    let lightOn = 5 - turn;
    let flagTimeReset = false;
    this.aniLight.setNumberByAni(lightOn, flagMust);
    if (turn == 1 || turn == 3) {
      if (round != this.lastRound) {
        this.prgTime.reset();
        flagTimeReset = true;
        this.lastRound = round;
      }
    }
    if (!flagTimeReset) {
      this.prgTime.toggleTimer(true);
    }
  }
  // update (dt) {}
}
