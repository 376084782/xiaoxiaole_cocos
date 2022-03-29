var CryptoJS=CryptoJS||function(h,o){var f={},j=f.lib={},k=j.Base=function(){function a(){}return{extend:function(b){a.prototype=this;var c=new a;b&&c.mixIn(b);c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.$super.extend(this)}}}(),i=j.WordArray=k.extend({init:function(a,b){a=
  this.words=a||[];this.sigBytes=b!=o?b:4*a.length},toString:function(a){return(a||p).stringify(this)},concat:function(a){var b=this.words,c=a.words,d=this.sigBytes,a=a.sigBytes;this.clamp();if(d%4)for(var e=0;e<a;e++)b[d+e>>>2]|=(c[e>>>2]>>>24-8*(e%4)&255)<<24-8*((d+e)%4);else if(65535<c.length)for(e=0;e<a;e+=4)b[d+e>>>2]=c[e>>>2];else b.push.apply(b,c);this.sigBytes+=a;return this},clamp:function(){var a=this.words,b=this.sigBytes;a[b>>>2]&=4294967295<<32-8*(b%4);a.length=h.ceil(b/4)},clone:function(){var a=
  k.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var b=[],c=0;c<a;c+=4)b.push(4294967296*h.random()|0);return i.create(b,a)}}),l=f.enc={},p=l.Hex={stringify:function(a){for(var b=a.words,a=a.sigBytes,c=[],d=0;d<a;d++){var e=b[d>>>2]>>>24-8*(d%4)&255;c.push((e>>>4).toString(16));c.push((e&15).toString(16))}return c.join("")},parse:function(a){for(var b=a.length,c=[],d=0;d<b;d+=2)c[d>>>3]|=parseInt(a.substr(d,2),16)<<24-4*(d%8);return i.create(c,b/2)}},n=l.Latin1={stringify:function(a){for(var b=
  a.words,a=a.sigBytes,c=[],d=0;d<a;d++)c.push(String.fromCharCode(b[d>>>2]>>>24-8*(d%4)&255));return c.join("")},parse:function(a){for(var b=a.length,c=[],d=0;d<b;d++)c[d>>>2]|=(a.charCodeAt(d)&255)<<24-8*(d%4);return i.create(c,b)}},q=l.Utf8={stringify:function(a){try{return decodeURIComponent(escape(n.stringify(a)))}catch(b){throw Error("Malformed UTF-8 data");}},parse:function(a){return n.parse(unescape(encodeURIComponent(a)))}},m=j.BufferedBlockAlgorithm=k.extend({reset:function(){this._data=i.create();
  this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=q.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var b=this._data,c=b.words,d=b.sigBytes,e=this.blockSize,f=d/(4*e),f=a?h.ceil(f):h.max((f|0)-this._minBufferSize,0),a=f*e,d=h.min(4*a,d);if(a){for(var g=0;g<a;g+=e)this._doProcessBlock(c,g);g=c.splice(0,a);b.sigBytes-=d}return i.create(g,d)},clone:function(){var a=k.clone.call(this);a._data=this._data.clone();return a},_minBufferSize:0});j.Hasher=m.extend({init:function(){this.reset()},
reset:function(){m.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);this._doFinalize();return this._hash},clone:function(){var a=m.clone.call(this);a._hash=this._hash.clone();return a},blockSize:16,_createHelper:function(a){return function(b,c){return a.create(c).finalize(b)}},_createHmacHelper:function(a){return function(b,c){return r.HMAC.create(a,c).finalize(b)}}});var r=f.algo={};return f}(Math);

(function(){var h=CryptoJS,i=h.lib.WordArray;h.enc.Base64={stringify:function(b){var e=b.words,f=b.sigBytes,c=this._map;b.clamp();for(var b=[],a=0;a<f;a+=3)for(var d=(e[a>>>2]>>>24-8*(a%4)&255)<<16|(e[a+1>>>2]>>>24-8*((a+1)%4)&255)<<8|e[a+2>>>2]>>>24-8*((a+2)%4)&255,g=0;4>g&&a+0.75*g<f;g++)b.push(c.charAt(d>>>6*(3-g)&63));if(e=c.charAt(64))for(;b.length%4;)b.push(e);return b.join("")},parse:function(b){var b=b.replace(/\s/g,""),e=b.length,f=this._map,c=f.charAt(64);c&&(c=b.indexOf(c),-1!=c&&(e=c));
  for(var c=[],a=0,d=0;d<e;d++)if(d%4){var g=f.indexOf(b.charAt(d-1))<<2*(d%4),h=f.indexOf(b.charAt(d))>>>6-2*(d%4);c[a>>>2]|=(g|h)<<24-8*(a%4);a++}return i.create(c,a)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}})();

var kk = (function(w, cry) {

  function Tool() {
   
  }

  //@desc是否是苹果移动端
  //@return Boolean
  Tool.prototype.isIos = (function() {
    return !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
  })()

  //@desc 是否是安卓移动端
  //@return Boolean
  Tool.prototype.isAndroid = (function() {
    return navigator.userAgent.indexOf('Android') > -1 || navigator.userAgent.indexOf('Linux') > -1;
  }) ()

  //@desc 客户端 GET 请求
  //@method GET
  //@param String url 请求的 URL
  //@param Object data 请求的 query 参数, 没有可传空
  //@param callback String 回调函数的名字,此回调函数会在请求成功之后由客户端调起 
  Tool.prototype.get = function(url, data, callback) {
    this.callback = callback
    var data = {
      requestType: 'GET',
      url: url,
      para: data,
      response: 'kk.callback'
    };
    if (this.isAndroid) {
      keke.commonRequestAction(JSON.stringify(data));
    } else if (this.isIos) {
      window.webkit.messageHandlers.commonRequestAction.postMessage(data);
    }
  }

  //@desc 客户端 POST 请求
  //@method POST
  //@param String url 请求的 URL
  //@param Object data 请求的 query 参数, 没有可传空
  //@param callback String 回调函数的名字,此回调函数会在请求成功之后由客户端调起 
  Tool.prototype.post = function(url, data, callback) {
    this.callback = callback
    var data = {
      requestType: 'POST',
      url: url,
      para: data,
      response: 'kk.callback'
    };
    if (this.isAndroid) {
      keke.commonRequestAction(JSON.stringify(data));
    } else if (this.isIos) {
      window.webkit.messageHandlers.commonRequestAction.postMessage(data);
    }
  }

  //@desc 唤醒客户端分享
  //@param String img 分享的图片
  //@param String title 分享的标题
  //@param String desc 分享的描述
  //@param String url 分享的链接 
  Tool.prototype.share = function(img, title, desc, url) {
    var data = {
      img: img,
      title: title,
      desc: desc,
      url: url
    };
    if (this.isIos) {
      window.webkit.messageHandlers.shareClicked.postMessage(data);
    } else if (this.isAndroid) {
      keke.shareClicked(data.url, data.img, data.desc, data.title);
    }
  }

  Tool.prototype.shareFriends = function(image, name, url) {
    var data = {
      image: image,
      name: name,
      url: url
    }
    if (this.isIos) {
      window.webkit.messageHandlers.shareFriendsClicked.postMessage(data);
    } else if (this.isAndroid) {
      keke.shareFriendsClicked(data.image, data.name, data.url);
    }
  }

  //@desc 唤醒客户端支付
  Tool.prototype.pay = function () {
    if (this.isIos) {
      window.webkit.messageHandlers.rechargeClicked.postMessage('');
    } else if (this.isAndroid) {
      keke.rechargeClicked();
    }
  }

  // 关闭h5页面
  Tool.prototype.closeH5 = function () {
    if (this.isIos) {
      window.webkit.messageHandlers.closeRoomViewClicked.postMessage('');
    } else if (this.isAndroid) {
      keke.closeRoomViewClicked();
    }
  }

  // 打开新的h5
  Tool.prototype.openNewH5 = function (url) {
    var data = {
        action: url,
        code: 100009
    };
    if (this.isIos) {
      window.webkit.messageHandlers.onClickOpen.postMessage(data);
    } else if (this.isAndroid) {
      keke.onClickOpen(JSON.stringify(data));
    }
  }

  //打开一个房间
  Tool.prototype.openRoom = function (room_id) {
    var data = {
        room_id: room_id,
        code: 100002
    };
    if (this.isIos) {
      window.webkit.messageHandlers.onClickOpen.postMessage(data);
    } else if (this.isAndroid) {
      keke.onClickOpen(JSON.stringify(data));
    }
  }

  Tool.prototype.getToken = function(fun) {
    if (this.isIos) {
      window.webkit.messageHandlers.getCookieToken.postMessage('');
    } else if (this.isAndroid) {
      keke.getCookieToken();
    }

     w.userCookieToken = function(str) {
      fun(str)
    }
  }

  Tool.prototype.joinGameCallBack = function(user_id) {
    var data = {
      user_id: user_id
    }
    if (this.isIos) {
      window.webkit.messageHandlers.joinGameCallBack.postMessage(data);
    } else if (this.isAndroid) {
      keke.joinGameCallBack(user_id);
    }
  }

  //@desc 解析 URL 参数部分
  //@return array
  Tool.prototype.$_GET = (function(){
    var url = window.document.location.href.toString();
    var u = url.split("?");
    if(typeof(u[1]) == "string"){
        u = u[1].split("&");
        var get = {};
        for(var i in u){
            var j = u[i].split("=");
            get[j[0]] = j[1];
        }
        return get;
    } else {
        return {};
    }
  })()

  Tool.prototype.parseBase64 = function(res) {
    res = cry.enc.Base64.parse(res)
    result = res.toString(cry.enc.Utf8)
    result = eval('(' + result + ')')
    return result
  }

  return new Tool();
})(window, CryptoJS)

