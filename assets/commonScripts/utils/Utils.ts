import PromiseUtil from "./PromiseUtil";
import Toast from "../Toast";

// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass("Utils")
export default class Utils {
  static debounce(func, wait, immediate) {
    let timer;
    return function () {
      let context = this,
        args = arguments;

      if (timer) clearTimeout(timer);
      if (immediate) {
        let callNow = !timer;
        timer = setTimeout(() => {
          timer = null;
        }, wait);
        if (callNow) func.apply(context, args);
      } else {
        timer = setTimeout(() => {
          func.apply(context, args);
        }, wait);
      }
    };
  }
  static subString(str, len) {
    if (!str) {
      str = "";
    }
    var newLength = 0;
    var newStr = "";
    var chineseRegex = /[^\x00-\xff]/g;
    var singleChar = "";
    var strLength = str.replace(chineseRegex, "**").length;
    if (strLength > len) {
      for (var i = 0; i < strLength; i++) {
        singleChar = str.charAt(i).toString();
        if (singleChar.match(chineseRegex) != null) {
          newLength += 2;
        } else {
          newLength++;
        }
        if (newLength > len) {
          break;
        }
        newStr += singleChar;
      }

      if (strLength > len) {
        newStr += "...";
      }
    } else {
      newStr = str;
    }
    return newStr;
  }
  static tweenAnimate(obj, duration: number, delay: number, to: Object) {
    return new Promise(rsv => {
      cc.tween(obj)
        .delay(delay)
        .to(duration, to)
        .call(e => {
          rsv(null);
        })
        .start();
    });
  }
  static loadingToast = false;
  static prefabToast = null;
  static async showToast(txt) {
    if (this.loadingToast) {
      PromiseUtil.wait(0.2).then(e => {
        this.showToast(txt);
      });
      return;
    }
    if (!this.prefabToast) {
      this.loadingToast = true;
      this.prefabToast = await Utils.load("prefab/Toast", cc.Prefab);
      this.loadingToast = false;
    }
    let toast = cc.instantiate(this.prefabToast) as cc.Node;
    let ctr = toast.getComponent(Toast);
    ctr.setData(txt);
    cc.director
      .getScene()
      .getChildByName("Canvas")
      .addChild(toast);
    cc.tween(toast)
      .set({
        y: -200,
        opacity: 0
      })
      .to(0.2, { y: -150, opacity: 255 })
      .delay(1)
      .to(0.2, {
        y: -200,
        opacity: 0
      })
      .start();
  }

  // static show

  static playSound(url) {
    return new Promise(rsv => {
      cc.resources.load(url, cc.AudioClip, (err, res: cc.AudioClip) => {
        let audio = cc.audioEngine.play(res, false, 1);
        rsv(audio);
      });
    });
  }
  static async asyncByTime(time) {
    return new Promise(rsv => {
      setTimeout(() => {
        rsv(null);
      }, time);
    });
  }
  static throttle(func, delay) {
    var prev = Date.now();
    return function () {
      var context = this;
      var args = arguments;
      var now = Date.now();
      if (now - prev >= delay) {
        func.apply(context, args);
        prev = Date.now();
      }
    };
  }
  static getQueryVariable(variable, query?) {
    query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (pair[0] == variable) {
        return pair[1];
      }
    }
    return null;
  }
  static goScene(url) {
    return new Promise(rsv => {
      cc.director.loadScene(url, (err, scene) => {
        rsv(null);
      });
    });
    // cc.tween(self)
    //   .to(0.2, { opacity: 0 })
    //   .start();
  }
  static getPrefab(addres: string) {
    return new Promise(rsv => {
      cc.resources.load(addres, cc.Prefab, (err, res) => {
        rsv(res);
      });
    });
  }
  static setSpFont(container: cc.Label, addres: string) {
    return new Promise((rsv, rej) => {
      cc.resources.load(addres, cc.BitmapFont, (err, spFrame) => {
        container.font = spFrame as cc.BitmapFont | null;
        rsv(null);
      });
    });
  }
  static canvas;
  static getBase64Image(img) {
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
    }
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    var ctx = this.canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, img.width, img.height);
    var ext = img.src.substring(img.src.lastIndexOf(".") + 1).toLowerCase();
    var dataURL = this.canvas.toDataURL("image/" + ext);
    return dataURL;
  }

  static setSpImgFromNet(container: cc.Sprite, addres: string) {
    return new Promise((rsv, rej) => {
      cc.assetManager.loadRemote(addres, (err, texture: cc.Texture2D) => {
        var frame = new cc.SpriteFrame(texture);
        container.spriteFrame = frame as cc.SpriteFrame | null;
        rsv(null);
      });
    });
  }
  static listImg = [];
  static flagLoadingImg = false;
  static setSpImgFromNet2(container: cc.Sprite, addres: string) {
    return new Promise(async (rsv, rej) => {
      if (this.flagLoadingImg) {
        // await PromiseUtil.wait(0.1);
        // return this.setSpImgFromNet(container, addres);
      }
      this.flagLoadingImg = true;
      // addres =
      //   "http://ll-res.ll18.cn/gift/image/platform/bc1579d8-50d0-11eb-8915-0242ac120004.png!default.png";

      addres = addres.replace("!default.png", "");
      addres = addres.replace(
        "http://paopao-files.xwab.cn/",
        "http://ll-res.ll18.cn/"
      );
      if (addres) {
        if (this.listImg[addres]) {
          container.spriteFrame = this.listImg[addres];
          this.flagLoadingImg = false;
          rsv(null);
        } else {
          let img = new Image();
          img.setAttribute("crossOrigin", "anonymous");
          img.src = addres;

          img.addEventListener("load", e => {
            this.flagLoadingImg = false;
            let img2 = new Image();
            img2.src = this.getBase64Image(img);
            let texture = new cc.Texture2D();
            texture.initWithElement(img);
            let frame = new cc.SpriteFrame(texture);
            container.spriteFrame = frame as cc.SpriteFrame | null;
            this.listImg[addres] = frame;

            rsv(null);
          });
        }
      } else {
        this.flagLoadingImg = false;
        console.log("无地址");
        rej(null);
      }
    });
  }
  static async load(addres, type) {
    return new Promise(rsv => {
      let res = cc.assetManager.getBundle("resources").get(addres, type);
      if (res) {
        rsv(res);
      } else {
        cc.resources.load(addres, type, (err, res) => {
          rsv(res);
        });
      }
    });
  }
  static setSpImg(container: cc.Sprite, addres: string) {
    return new Promise((rsv, rej) => {
      if (!addres) {
        container.spriteFrame = null;
        rsv(null);
      } else {
        let spFrame = cc.assetManager
          .getBundle("resources")
          .get(addres, cc.SpriteFrame);
        if (spFrame) {
          if (container && container.isValid && spFrame) {
            container.spriteFrame = spFrame as cc.SpriteFrame | null;
          }
          rsv(null);
        } else {
          cc.resources.load(addres, cc.SpriteFrame, (err, spFrame) => {
            if (container && container.isValid && spFrame) {
              container.spriteFrame = spFrame as cc.SpriteFrame | null;
            }
            rsv(null);
          });
        }
      }
    });
  }

  static timeFormat(fmt, surtime) {
    var d = Math.floor(surtime / (24 * 3600));
    var leave1 = surtime % (24 * 3600);
    var h = Math.floor(leave1 / 3600); //计算相差分钟数
    var leave2 = leave1 % 3600; //计算小时数后剩余的毫秒数
    var m = Math.floor(leave2 / 60); //计算相差秒数
    var leave3 = leave2 % 60; //计算分钟数后剩余的毫秒数
    var s = Math.round(leave3);

    let ret;
    let opt = {
      "d+": d.toString(), // 日
      "H+": h.toString(), // 时
      "M+": m.toString(), // 分
      "S+": s.toString() // 秒
      // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
      ret = new RegExp("(" + k + ")").exec(fmt);
      if (ret) {
        fmt = fmt.replace(
          ret[1],
          ret[1].length == 1
            ? opt[k]
            : ("0000000" + opt[k]).slice(-ret[1].length)
        );
      }
    }
    return fmt;
  }
  static dateFormat(fmt, date) {
    let ret;
    let opt = {
      "Y+": date.getFullYear().toString(), // 年
      "m+": (date.getMonth() + 1).toString(), // 月
      "d+": date.getDate().toString(), // 日
      "H+": date.getHours().toString(), // 时
      "M+": date.getMinutes().toString(), // 分
      "S+": date.getSeconds().toString() // 秒
      // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
      ret = new RegExp("(" + k + ")").exec(fmt);
      if (ret) {
        fmt = fmt.replace(
          ret[1],
          ret[1].length == 1
            ? opt[k]
            : ("000000" + opt[k]).slice(-ret[1].length)
        );
      }
    }
    return fmt;
  }
  static flagAjaxing = false;
  static generateData(data) {
    var encrypt = new window["JSEncrypt"]();
    var publicKeyBase64 =
      "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDlCy2RqivbXI/TJDuow9dCe1kkXrl5oUgT5hGrr853FoBH6ZPUpPGA3Nyq2kuxxqkLl6dwi6X6WxLUVL/Dg59fR0MSD3YS/cLNZlGB25cXpKIPTY1zC/jwWCc/3hht4E8CqyTQK1xXMYRgSQmVDhVd10EUss9ypGSOnmGRLlAHmwIDAQAB";
    encrypt.setPublicKey(publicKeyBase64);

    var timestamp = new Date().valueOf();
    data.timestamp = timestamp;
    var json = JSON.stringify(data);
    return encrypt.encrypt(json);
  }
  // static host = 'https://sbzfront.test.pingchuanwangluo.cn'
  static host = 'https://gongzhong.surbunjew.com'
  static doAjax({ url = "", data = {}, method = "get", noPop = false }) {
    method = method.toUpperCase();
    let host = this.host + "/api/out/xxl";
    if (url.indexOf("http") == -1) {
      url = host + url;
    }
    console.log("请求", data, url);
    return new Promise(async (rsv, rej) => {
      var objStr = this.generateData(data);
      window["$"].ajax({
        url: url,
        type: method,
        xhrFields: {
          withCredentials: false
        },
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "Cookie,Set-Cookie,Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin",
          "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS",
          "X-Powered-By": "3.2.1",
          "Content-Type": "text/plain; charset=UTF-8"
        },
        data: objStr,
        success(result) {
          if (result.result == 1) {
            rsv(result.data);
          } else if (result.result != 400) {
            Utils.showToast(result.msg);
          }
        },
        error() {
          Utils.showToast('网络错误，请重试~');
        }
      });
    });
  }
}

window["Utils"] = Utils;
