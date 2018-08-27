// 权限认证
import config from '../config/common'; //公共配置文件
import ajax from '../../common/js/ajax.js';

let userInfo = {
        userid: 0,
        username: "",
        isLogin: false
    },
    starInfo = {
        starid: 0
    };

let auth = {
    // 登录
    login: (mobilePhone, verifyCode, callback) => {
        ajax.post(`${config.baseUrl}/api/v1/phone_vercode_login`, {
            act: 11,
            mobile_phone: mobilePhone,
            ticket_code: verifyCode
        }).done(data => {
            callback && callback.onSuccess(data);
        }).fail(json => {
            callback && callback.onFail(json);
        });
    },
    wechatConfig: (callback) => {
        if (!config.isWechat) return;
        if (auth.configed) {
            wx.ready(() => {
                callback && callback();
            });
        } else {
            ajax.get(`${config.baseUrl}/live/get_sign_obj`, {
                url: encodeURIComponent(location.href)
            }).done(data => {
                auth.configed = true;
                wx.config({
                    debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                    appId: data.appid || '', // 必填，公众号的唯一标识
                    timestamp: data.timestamp || 1, // 必填，生成签名的时间戳
                    nonceStr: data.noncestr || '', // 必填，生成签名的随机串
                    signature: data.signature || '', // 必填，签名，见附录1
                    jsApiList: [
                        'onMenuShareTimeline',
                        'onMenuShareAppMessage',
                        'onMenuShareQQ',
                        'onMenuShareWeibo',
                        'onMenuShareQZone',
                        'hideMenuItems',
                        'hideOptionMenu',
                        'showOptionMenu'
                    ]
                });
                wx.ready(() => {
                    callback && callback();
                });
            }).fail(data => {
                wx.config({
                    debug: false,
                    appId: '',
                    timestamp: 1,
                    nonceStr: '',
                    signature: '',
                    jsApiList: []
                });
                wx.ready(() => {
                    callback && callback();
                });
            });
        }
    },
    wechatLogin: (callback) => {
        if (!userInfo.isLogin) {
            let openid = config.utils.queryString('oid');
            if (openid) {
                ajax.post(`${config.baseUrl}/api/v1/oauth_login`, {
                    act: 11,
                    openid: openid
                }).done(data => {
                    userInfo = {
                        userid: data.uid,
                        username: data.name,
                        isLogin: true,
                        balance: data.balance
                    }
                    if (config.isAndroid) {
                        history.replaceState({}, "", location.origin + location.pathname);
                    }
                    auth.wechatConfig();
                    callback && callback();
                });
            } else {
                location.href = 'http://yimipay.artqiyi.com/weixin/weixin/checkoauth?scope=base&redirect=' + encodeURIComponent(location.origin + location.pathname);
            }
        } else {
            callback && callback();
        }
    },
    // 获取主播信息
    getStarInfo: () => {
        return starInfo;
    },
    //设置主播信息
    setStarInfo: (data) => {
        starInfo = data;
    },
    // 设置用户信息
    setUserInfo: (data) => {
        userInfo = data;
    },
    // 获取用户信息
    getUserInfo: (callback) => {
        let url = `${config.baseUrl}/api/v1/userinfo?act=11`;
        if (config.isArtqiyi) {
            url = `${config.baseUrl}/api/v1/userinfo?act=1&tokenkey=${config.utils.queryString("tokenkey")}`;
        }
        if (auth.rendered) {
            callback && callback();
            return userInfo;
        }

        ajax.get(url).done(data => {
            userInfo = {
                userid: data.uid,
                username: data.name,
                isLogin: true,
                balance: data.balance
            };
            auth.rendered = 1;
            callback && callback();
            return userInfo;
        }).fail(json => {
            let matchResult = document.cookie.match(/UUID=(\w+)/),
                userid, username;
            if (!matchResult || !matchResult[1]) {
                userid = (new Date()).getTime().toString() + Math.random().toString().slice(2, 7);
                username = userid.substr(userid.length - 6, 6);
                document.cookie = 'UUID=' + userid;
            } else {
                userid = matchResult[1];
                username = matchResult[1].substr(matchResult[1].length - 6, 6);
            }
            userInfo.userid = userid;
            userInfo.username = username;
            auth.rendered = 1;
            callback && callback();
            return userInfo;
        });
    }
}
module.exports = auth;