import {Component} from 'react';
import './video-player.scss';
import config from '../config/common'; //公共配置文件
import auth from '../js/auth'; //权限验证
import VideoControl from './video-control';

let lastActiveTime = new Date().getTime(),
    lastTipsTime = new Date().getTime(),
    isFormal = /live\./ig.test(location.href),
    bLiveVideoTimer = null,
    videoStatus,canAutoPlay = (config.isIOS && config.isWechat);

class VideoPlayer extends Component {
    constructor() {
        super();
        // 初始化播放器相关参数
        this.state = {
            currentTime: 0,
            showPause: false,
            show:true,
            fullscreen:false
        }
        this.onPause = this.onPause.bind(this);
        this.onEnded = this.onEnded.bind(this);
        this.onPlay = this.onPlay.bind(this);
        this.onTimeUpdate = this.onTimeUpdate.bind(this);
    }

    // 自动播放
    play() {
        if(canAutoPlay){
            auth.wechatConfig(() => {
                this.video.play();
            });
        }else{
            this.setState({
                showPause:true
            });
        }
    }

    renderVideoStatus(status) {
        videoStatus = status;
        switch (status) {
            case 1:
                this.play();
                // this.initCheckInterval();
                break;
            default:
                this.setState({
                    tips: `主播出去一小会儿，不要走开哦... ${videoStatus} currentSrc:${this.video.currentSrc}`
                });
                // this.video.pause();
                break;
        }
    }

    dealWithStopLive(data) {
        videoStatus = 2;
        this.setState({
            showPause: true
        });
        let liveStatus = data.live_status;
        this.video.play();
        switch (liveStatus) {
            case 'stop':
                this.video.src = '';
                this.video.load();
                break;
            case 'pause':
                this.setState({
                    tips: `主播出去一小会儿，不要走开哦... ${videoStatus} currentSrc:${this.video.currentSrc}`
                });
                this.video.pause();
                break;
        }
    }

    dealWithNewLiveUrl(data) {
        videoStatus = 1;
        let {src} = this.props;
        this.setState({
            showPause: false
        });
        lastActiveTime = new Date().getTime();
        lastTipsTime = new Date().getTime();
        //收到新地址socket
        if (src !== data.hls_play_url) {
            this.video.src = data.hls_play_url;
            this.setState({
                tips: `主播回来了，精彩马上继续... ${data.hls_play_url}`,
            });
            this.video.load();
            this.play();
        } else {
            this.setState({
                tips: `主播回来了，精彩继续...${data.hls_play_url}`
            });
            this.video.play();
        }
        this.initCheckInterval();
    }

    initCheckInterval() {
        if (videoStatus != 1) return;
        this.setDebugTips(`offsetTime:${new Date().getTime() - lastActiveTime} currentSrc:${this.video.currentSrc}`);
        if (new Date().getTime() - lastActiveTime >= 8000) {
            lastActiveTime = new Date().getTime();
            this.video.play();
        }
        if (new Date().getTime() - lastTipsTime >= 2000) {
            lastTipsTime = new Date().getTime();
            this.setState({
                tips: ''
            });
        }
        this.checkRequestFrame = window.requestAFrame(() => {
            this.initCheckInterval();
        });
    }

    onPlay(){
        let {type} = this.props;
        if(type != 'live' && config.isAndroid){
            let oLiveCanvas2D = this.canvas.getContext('2d');
            this.drawImage(oLiveCanvas2D);
        }
    }

    onPause() {
        this.clearVideoInterval();
        this.setState({
            showPause: videoStatus == 2? false : true
        });
        this.setDebugTips(`onPause videoStatus:${videoStatus}`)
    }

    onEnded() {
        let {timeUpdate} = this.props;
        timeUpdate && timeUpdate('end');
        this.clearVideoInterval();
    }

    onTimeUpdate() {
        let {showPause} = this.state;
        if (videoStatus != 1) return;
        this.video.style.width = '100%';
        this.video.style.height = '100%';
        let {timeUpdate} = this.props,
            {currentTime,paused,buffered} = this.video;
        this.setState({
            currentTime: currentTime,
            showPause:false
        });
        if(buffered.length){
            this.setState({
                buffered:buffered.end(0)
            });
        }
        this.setDebugTips(`timeUpdate ${new Date().getTime()}`)
        lastActiveTime = new Date().getTime();
        timeUpdate && timeUpdate(currentTime);
    }

    setDebugTips(tips) {
        if (isFormal) return;
        this.setState({
            debug_tips: tips
        });
    }

    drawImage(canvas){
        let {width,height} = this.props;
        bLiveVideoTimer = setInterval(()=> {
            canvas.drawImage(this.video, 0, 0, width, height);
        }, 20);
    }

    clearVideoInterval(){
        let {type} = this.props;
        if(type != 'live' && config.isAndroid){
            clearInterval(bLiveVideoTimer);
            bLiveVideoTimer = null;
        }
    }

    componentDidMount() {
        let {status} = this.props;
        this.renderVideoStatus(status||1);
        this.video.setAttribute("x5-video-player-type", "h5");
        this.video.setAttribute("x5-video-player-fullscreen", "true");
        this.video.setAttribute("playsinline", true);
        this.video.setAttribute("webkit-playsinline", true);
        this.video.addEventListener('play', this.onPlay, false);
        this.video.addEventListener('timeupdate', this.onTimeUpdate, false);
        this.video.addEventListener("x5videoexitfullscreen", this.onPause, false);
        this.video.addEventListener("pause", this.onPause, false);
        this.video.addEventListener('ended',this.onEnded, false);
    }

    componentWillUnmount() {
        this.video.removeEventListener('play', this.onPlay, false);
        this.video.removeEventListener('timeupdate', this.onTimeUpdate, false);
        this.video.removeEventListener("x5videoexitfullscreen", this.onPause, false);
        this.video.removeEventListener("pause", this.onPause, false);
        this.video.removeEventListener('ended',this.onEnded, false);
        this.clearCheckInterval();
        this.video.src = '';
        this.video.load();
    }

    clearCheckInterval() {
        window.cancelAFrame(this.checkRequestFrame);
    }

    togglePlay() {
        let {paused,showPause} = this.video;
        if(paused){
            this.video.play();
            showPause = false;
        }else{
            this.video.pause();
            showPause = true;
        }
        this.setState({
            showPause:showPause
        });
    }

    updateProgress(time){
        this.video.currentTime = time;
    }

    startPlay() {
        this.setState({
            showPause: false
        });
        this.video.play();
    }

    resizeToFullScreen(){
        let {width,height} = this.props;
        let conW = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;  
        let conH = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;  
        if(width > height){
            this.videoPlayer.style.transform = "rotate(90deg) translate("+((conH-conW)/2)+"px,"+((conH-conW)/2)+"px)";
            this.videoPlayer.style.width = conH+"px";
            this.videoPlayer.style.height = conW+"px";
        }else{
            this.videoPlayer.style.width = conW+"px";
            this.videoPlayer.style.height = conH+"px";
        }
    }

    /*全屏切换*/  
    toggleFullScreen(){  
        let {fullscreen} = this.state;
        if(fullscreen){
            fullscreen = false;
            this.videoPlayer.style.transform = "";
            this.videoPlayer.style.width = "";
            this.videoPlayer.style.height = "";
        }else{
            fullscreen = true;
            this.resizeToFullScreen();
        }
        this.setState({
            fullscreen:fullscreen
        });
    }  

    toggleControl(){
        let {showControl} = this.props;    
        if(showControl){
            this.videoControl.toggleControl();
        }
    }

    render() {
        let isDebug = !/live\./ig.test(location.href),
            {src,showControl,type,width,height,cover,shopStr} = this.props,
            {tips,debug_tips,showPause,duration,currentTime,buffered,show,fullscreen} = this.state;
        let controlStr = '',
            videoClass = '',
            style = cover ? {backgroundImage:`url(${cover})`} : {};
        if(showControl){
            controlStr = (
                <VideoControl
                    ref={control => this.videoControl = control}
                    {...this.props}
                    paused={showPause}
                    fullscreen={fullscreen}
                    currentTime={currentTime}
                    buffered={buffered}
                    onUpdate={(time) => this.updateProgress(time)}
                    onTogglePlay={() => this.togglePlay()}
                    onToggleFullScrren={() => this.toggleFullScreen()}
                />
            );
        } 
        if(config.isAndroid && type != 'live') videoClass += ' hidden';
        return (
            <div className={`video-player clearfix ${fullscreen?'fullscreen':''}`} 
                style={style}
                ref={videoPlayer => this.videoPlayer = videoPlayer}>
                <div className={showPause?"pause":"pause hidden"} onClick={()=> {this.startPlay()}}/>
                <div className="canvas">
                    {type !='live' && config.isAndroid?<canvas width={width} height={height} ref={canvas => this.canvas = canvas}  onClick={() => this.toggleControl()}/>:''}
                </div>
                <video 
                    ref={video => this.video = video}
                    src={src} 
                    onClick={() => this.toggleControl()}
                    className={videoClass}>
                    <span>您的手机版本，网页版暂未能支持！</span>
                </video>
                <div className="wrapper">
                    {shopStr}
                    {controlStr}
                </div>
                <div className={tips?'video-tips':'video-tips'}>{this.state.tips}</div>
                {isDebug?<div className='debug-tips'>{this.state.debug_tips}</div>:''}
            </div>
        );
    }
}

export default VideoPlayer;