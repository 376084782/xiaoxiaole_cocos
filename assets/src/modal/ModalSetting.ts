import { PopupBase } from "../../commonScripts/popups/PopupBase";
import AudioPlayer from "../../commonScripts/core/AudioPlayer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ModalSetting extends PopupBase {
  @property(cc.Toggle)
  toggleEffect: cc.Toggle = null;

  @property(cc.Toggle)
  toggleMusic: cc.Toggle = null;

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {}

  start() {}
  init() {
    this.toggleMusic.isChecked = AudioPlayer.musicVolume == 1;
    this.toggleEffect.isChecked = AudioPlayer.effectVolume == 1;
  }
  onMusicToggle() {
    AudioPlayer.setMusicVolume(this.toggleMusic.isChecked ? 1 : 0);
  }
  onEffectToggle() {
    AudioPlayer.setEffectVolume(this.toggleEffect.isChecked ? 1 : 0);
  }

  // update (dt) {}
}
