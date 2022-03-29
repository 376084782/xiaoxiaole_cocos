import Utils from "../../commonScripts/utils/Utils";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameRankGroupAvatar extends cc.Component {
  @property(cc.Label)
  nickname: cc.Label = null;
  @property(cc.Sprite)
  avatar: cc.Sprite = null;
  @property(cc.Label)
  score: cc.Label = null;
  setData(info) {
    if (info) {
      Utils.setSpImgFromNet(this.avatar, info.avatar);
      this.nickname.string = Utils.subString(info.nickname, 12);
      this.score.string = "" + info.score || "0";
    }
  }
}
