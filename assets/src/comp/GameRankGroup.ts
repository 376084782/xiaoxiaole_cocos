import GameRankGroupAvatar from "./GameRankGroupAvatar";
import Utils from "../../commonScripts/utils/Utils";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameRankGroup extends cc.Component {
  @property(GameRankGroupAvatar)
  avatar1: GameRankGroupAvatar = null;
  @property(GameRankGroupAvatar)
  avatar2: GameRankGroupAvatar = null;

  round = 1;
  @property(cc.Label)
  title: cc.Label = null;
  @property(cc.Sprite)
  light: cc.Sprite = null;
  setData(gameInfo) {
    if (gameInfo.isFinish) {
      this.light.node.active = false;
      this.title.font = null;
      this.title.string =
        Utils.subString(
          gameInfo.data2.uid == gameInfo.winner
            ? gameInfo.data2.nickname
            : gameInfo.data1.nickname,
          12
        ) + "赢了";
    } else {
      this.light.node.active = true;
      let round = Math.ceil(gameInfo.round / 2);
      if (round == 1) {
        this.title.string = "第一轮";
      } else if (round == 2) {
        this.title.string = "第二轮";
      } else if (round == 3) {
        this.title.string = "第三轮";
      } else {
        this.title.string = "决赛";
      }
    }
    this.avatar1.setData(gameInfo.data1);
    this.avatar2.setData(gameInfo.data2);
  }
  setDataByList(info1, info2) {
    this.light.node.active = false;
    this.title.string = "等待";
    this.avatar1.setData(info1);
    this.avatar2.setData(info2);
  }
}
