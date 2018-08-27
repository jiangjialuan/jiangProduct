window.requestAFrame = ((callback) => {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.setTimeout(callback, 1000 / 60); // shoot for 60 fps
})();

window.cancelAFrame = ((id) => {
    return window.cancelAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.oCancelAnimationFrame ||
        window.clearTimeout(id);
})();
let href = location.href,
    ua = navigator.userAgent,
    config = {
        baseUrl: /live\./ig.test(location.href) ? "http://live.artqiyi.com" : "http://livetest.artqiyi.com",
        isArtqiyi: ua.indexOf('artqiyi-live') > -1,
        isWechat: ua.indexOf('MicroMessenger') > -1,
        isIOS: /iphone|ipad|ipod/ig.test(navigator.userAgent),
        isAndroid: /android/ig.test(ua),
        utils: {
            dealWithDate: (str) => {
                let date = new Date(str),
                    length = str.length - 3,//忽略秒
                    currentDate = new Date(),
                    year = date.getFullYear(),
                    month = date.getMonth(),
                    day = date.getDate();
                if(year == currentDate.getFullYear()){
                   if(day == currentDate.getDate()){
                        return str.substr(11, length-11);
                    }
                    return str.substr(5, length-5);
                }else{
                    return str.substr(0, length);
                }    
            },
            dealWithCount: (params) => {
                let number = parseInt(params.number, 10),
                    basic = parseInt(params.basic, 10),
                    unit = params.unit,
                    toFixed = params.toFixed || 2;
                if (number >= basic) {
                    number = parseFloat(number / basic).toFixed(toFixed) + unit;
                }
                return number;
            },
            queryString: key => {
                return (document.location.search.match(new RegExp("(?:^\\?|&)" + key + "=(.*?)(?=&|$)")) || ['', null])[1];
            },
            offsetLeft: (elem) => {
                let left = elem.offsetLeft,
                    parent = elem.offsetParent;
                while (parent) {
                    left += parent.offsetLeft;
                    parent = parent.offsetParent;
                }
                return left;
            },
            formatTime: (time) => {
                time = isNaN(time) ? 0 : Math.floor(time);
                let hour = Math.floor(time / 3600),
                    minutes = Math.floor((time - hour * 3600) / 60),
                    seconds = Math.floor((time - hour * 3600) % 60);
                return (hour < 10 ? `0${hour}` : hour) + ":" + (minutes < 10 ? `0${minutes}` : minutes) + ":" + (seconds < 10 ? `0${seconds}` : seconds);
            },
            stopBounce: () => {
                let iLastTouch = null;
                document.body.addEventListener('touchend', function(event) {
                    let iNow = new Date().getTime();
                    iLastTouch = iLastTouch || iNow + 1;
                    let delta = iNow - iLastTouch;
                    if (delta < 500 && delta > 0) {
                        event.preventDefault();
                        return false;
                    }
                    iLastTouch = iNow;
                }, false);
            },
            setTitle: (title) => {
                document.title = title;
                const iframe = document.createElement('iframe');
                iframe.style.cssText = 'display: none; width: 0; height: 0;';
                iframe.src = '/common/image/blank.png';
                const listener = () => {
                    setTimeout(() => {
                        iframe.removeEventListener('load', listener);
                        document.body.removeChild(iframe);
                    }, 0);
                };
                iframe.addEventListener('load', listener);
                document.body.appendChild(iframe);
            }
        }
    };

export default config;