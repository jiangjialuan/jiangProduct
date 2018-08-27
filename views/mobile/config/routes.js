import config from '../config/common'; //公共配置文件
import auth from '../js/auth'; //权限验证

const redirectToWechatLogin = (nextState, replace, next) => {
    if (config.isWechat) { //如果是微信账号
        let userInfo = auth.getUserInfo();
        auth.wechatLogin(() => {
            _hmt.push(['_trackPageview', location.href]);
            next();
        });
    } else {
        auth.getUserInfo(() => {
            _hmt.push(['_trackPageview', location.href]);
            next();
        });
    }
}

export default {
    path: '/',
    component: require('../components/App'),
    childRoutes: [{
        path: '/index/:uid',
        onEnter: redirectToWechatLogin,
        getComponent(nextState, cb) {
            require.ensure([], (require) => {
                cb(this.forceUpdate, require('../components/star-info'))
            }, 'star-info')
        },
    }, {
        path: '/play/:roomid',
        onEnter: redirectToWechatLogin,
        getComponent(nextState, cb) {
            require.ensure([], (require) => {
                cb(this.forceUpdate, require('../components/play'))
            }, 'play')
        }
    }, {
        path: '/video/:vid',
        onEnter: redirectToWechatLogin,
        getComponent(nextState, cb) {
            require.ensure([], (require) => {
                cb(this.forceUpdate, require('../components/short-video'))
            }, 'video')
        }
    }, {
        path: '/playback/:uid/:vid',
        onEnter: redirectToWechatLogin,
        getComponent(nextState, cb) {
            require.ensure([], (require) => {
                cb(this.forceUpdate, require('../components/play-back'))
            }, 'play-back')
        },
    }, {
        path: '/service',
        getComponent(nextState, cb) {
            require.ensure([], (require) => {
                cb(this.forceUpdate, require('../components/service'))
            }, 'service-info')
        },
    }]
}
