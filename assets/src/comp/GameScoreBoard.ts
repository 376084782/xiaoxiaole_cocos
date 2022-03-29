import EventManager from "../../commonScripts/core/EventManager";
import BallScoreThisTurn from "./BallScoreThisTurn";
import PromiseUtil from "../../commonScripts/utils/PromiseUtil";
import GameManager from "../manager/GameManager";
import Utils from "../../commonScripts/utils/Utils";
import SocketManager from "../manager/SocketManager";
import AudioPlayer from "../../commonScripts/core/AudioPlayer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameScoreBoard extends cc.Component {
  @property(cc.Label)
  txtScore1: cc.Label = null;

  @property(cc.Label)
  txtScore2: cc.Label = null;

  @property(sp.Skeleton)
  aniHH: sp.Skeleton = null;

  @property(cc.Node)
  imgJSS: cc.Node = null;

  @property(BallScoreThisTurn)
  ballBlue: BallScoreThisTurn = null;
  @property(BallScoreThisTurn)
  ballRed: BallScoreThisTurn = null;
  // onLoad () {}

  start() {
    this.imgJSS.active = false;
    this.aniHH.node.active = false;
    this.listen();
  }
  resetAll() {
    let scoreSelf = SocketManager.matchInfo.data1.score;
    let scoreOppo = SocketManager.matchInfo.data2.score;
    this.changeHH(0);
    this.changeScoreBig(
      1,
      SocketManager.selfColor == 1 ? scoreSelf : scoreOppo
    );

    this.changeScoreBig(
      2,
      SocketManager.selfColor != 1 ? scoreSelf : scoreOppo
    );
  }
  doAdd(score, seat) {
    let color = SocketManager.colorSTC(seat);
    let target = color == 1 ? this.ballBlue : this.ballRed;
    target && target.doAdd(score);
  }
  moveLight(type, pos1, posEnd, seat) {
    let color = SocketManager.colorSTC(seat);
    let prefab = type == 1 ? this.prefabLightScore : this.prefabLightScore2;
    return new Promise(async rsv => {
      let light = cc.instantiate(prefab);
      light.x = pos1.x;
      light.y = pos1.y;
      if (type == 1) {
        // 修改拖尾贴图
        let ctrMotion = light.getComponent(cc.MotionStreak);
        ctrMotion.texture = (await Utils.load(
          `ani/${color == 1 ? "蓝色2" : "红2"}`,
          cc.Texture2D
        )) as cc.Texture2D;
      } else {
        // 修改粒子
        let ctrPar = light.getComponent(cc.ParticleSystem);
        ctrPar.file = (await Utils.load(
          `ani/tuowei-${color == 1 ? "lan" : "hong"}`,
          cc.ParticleAsset
        )) as cc.Texture2D;
      }
      this.node.parent.addChild(light);

      let pos2 = new cc.Vec2(
        pos1.x - 45 + 90 * Math.random(),
        pos1.y - 45 + 90 * Math.random()
      );
      cc.tween(light)
        .to(2 / 30, {
          x: pos2.x,
          y: pos2.y
        })
        .delay(2 / 30)
        .call(() => {
          let action = cc.bezierTo(4 / 30, [
            cc.v2(pos1.x, pos1.y),
            cc.v2((pos1.x + posEnd.x) / 2 - 150, (pos1.y + posEnd.y) / 2),
            posEnd
          ]);

          light.runAction(action);

          PromiseUtil.wait(8 / 30).then(e => {
            cc.tween(light)
              .to(2 / 30, {
                opacity: 0
              })
              .call(() => {
                light.destroy();
                rsv(null);
              })
              .start();
          });
        })
        .start();
    });
  }
  @property(cc.Prefab)
  prefabLightScore: cc.Prefab = null;
  @property(cc.Prefab)
  prefabLightScore2: cc.Prefab = null;

  get ballTarget() {
    return SocketManager.powerSeat == 1 ? this.ballBlue : this.ballRed;
  }
  onDestroy() {
    EventManager.remove("addScoreLight");
    EventManager.remove("showScoreToTotal");
    EventManager.remove("doAddScoreToTotal");
  }
  listen() {
    EventManager.on("addScoreLight", (e: any) => {
      GameManager.playMusicX();

      let color = SocketManager.colorSTC(e.seat);
      let target = color == 1 ? this.ballBlue : this.ballRed;

      let posEnd = target.node.convertToWorldSpaceAR(cc.v2(0, 0));

      this.node.parent.convertToNodeSpaceAR(posEnd, posEnd);
      let pos = this.node.parent.convertToNodeSpaceAR(cc.v2(e.pos.x, e.pos.y));

      this.moveLight(1, pos, posEnd, e.seat).then(() => {
        this.doAdd(1, e.seat);
      });
      this.moveLight(2, pos, posEnd, e.seat);
    });
    EventManager.on("showScoreToTotal", ({ seat, scoreAdd }) => {
      let color = SocketManager.colorSTC(seat);
      let target = color == 1 ? this.ballBlue : this.ballRed;
      target.doShow(scoreAdd);
    });
    EventManager.on("doAddScoreToTotal", async ({ seat, finalScore }) => {
      let color = SocketManager.colorSTC(seat);
      let target = color == 1 ? this.ballBlue : this.ballRed;
      let targetScore = color == 1 ? this.txtScore1 : this.txtScore2;

      let time = 6 / 30;
      target.doHide(time);
      console.log(target.score, "target.scoretarget.scoretarget.score");

      let eachTime = time / target.score;
      for (let i = finalScore - target.score; i < finalScore; i++) {
        await PromiseUtil.wait(eachTime);
        targetScore.string = "" + (i + 1);
      }
    });
  }
  changeScoreBig(seat, score) {
    let txtScore = seat == 1 ? this.txtScore1 : this.txtScore2;
    txtScore.string = "" + score;
  }
  lastRound = 0;
  lastSeat = 0;
  changeHH(round, seat = 1) {
    if (round == this.lastRound && seat == this.lastSeat) {
      return;
    }
    this.lastRound = round;
    this.lastSeat = seat;

    if (round == 0) {
      this.imgJSS.active = false;
      this.aniHH.node.active = true;
      this.aniHH.setAnimation(1, "huise", false);
    } else if (round <= 4) {
      this.imgJSS.active = false;
      this.aniHH.node.active = true;
      this.aniHH.setAnimation(
        1,
        `huihe${round}_${seat == 1 ? "L" : "H"}`,
        false
      );
    } else {
      this.imgJSS.active = true;
      this.aniHH.node.active = false;
    }
  }
  // update (dt) {}
}
