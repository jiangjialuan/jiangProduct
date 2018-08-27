import {
    Component
} from 'react';
import './video-control.scss';
import config from '../config/common'; //公共配置文件

let lastActiveTime = new Date().getTime(),
    lastTipsTime = new Date().getTime(),
    isFormal = /live\./ig.test(location.href);
class VideoControl extends Component {
    constructor() {
        super();
        this.state = {
            show : false
        }
    }

    clearCheckInterval() {
        window.cancelAFrame(this.controlRequestFrame);
    }

    componentWillUnmount() {
        this.clearCheckInterval();
    }

    initControlInterval() {
        if (new Date().getTime() - lastActiveTime >= 3000) {
            this.setState({
                show:false
            });
        }
        this.controlRequestFrame = window.requestAFrame(() => {
            this.initControlInterval();
        });
    }

    toggleControl(){
        let {show} = this.state;
        if(show){
            this.setState({
                show:false
            });
        }else{
            lastActiveTime = new Date().getTime();
            this.setState({
                show:true
            });
        }
    }

    // 初始化进度条事件
    initControl(){
        let lastX,currentX = 0,offsetX,transformOrigin2,
            transformOrigin = window.getComputedStyle(this.videoSeek).transformOrigin,
            percentage,{duration,onUpdate} = this.props,
            offsetLeft = config.utils.offsetLeft(this.videoSeek),
            clientWidth = this.videoSeek.clientWidth;
        // 播放进度条拖动和点击
        this.videoSeek.addEventListener('touchstart', (e) => {
            transformOrigin2 = window.getComputedStyle(this.videoSeek).transformOrigin;
            offsetLeft = config.utils.offsetLeft(this.videoSeek);
            clientWidth = this.videoSeek.clientWidth;
            let target = e.target;
            target.style.webkitTransitionDuration = target.style.transitionDuration = '0ms';
            lastActiveTime = new Date().getTime();
            lastX = (transformOrigin == transformOrigin2)? e.touches[0].pageX : e.touches[0].pageY;
            currentX = 0;
        },false);
        this.videoSeek.addEventListener('touchmove', (e) => {
            let target = e.target;
            target.style.webkitTransitionDuration = target.style.transitionDuration = '8ms';
            lastActiveTime = new Date().getTime();
            currentX = (transformOrigin == transformOrigin2)? e.touches[0].pageX : e.touches[0].pageY;
            percentage = (currentX - offsetLeft) / clientWidth;
            onUpdate(percentage * duration);
        },false);
        this.videoSeek.addEventListener('touchend', (e) => {
            let target = e.target;
            target.style.webkitTransitionDuration = target.style.transitionDuration = '8ms';
            lastActiveTime = new Date().getTime();
            if (currentX == 0) {
                percentage = (lastX - offsetLeft) / clientWidth;
                onUpdate(percentage * duration);
            }
        },false);
    }

    componentDidMount() {
        this.initControl();
        this.initControlInterval();
    }

    render() {
        let {paused,duration,currentTime,buffered,onTogglePlay,onToggleFullScrren,fullscreen} = this.props,
            {show} = this.state;
        const playProgress = () =>{
            let progress = currentTime / duration;
            return progress * 100 + '%';
        };
        const bufferProgress = () =>{
            let progress = buffered / duration;
            return progress * 100 + '%';
        };

        return (
            <div className={`video-controls ${show?'show':''}`}>
                <button className={`video-icon ${paused?'video-play':''}`} onClick={() => onTogglePlay()}></button>
                <div className="video-seek clearfix" ref={seek => this.videoSeek = seek}>
                    <div className="video-seek__container">
                        <div className="video-buffer-bar" style={{width: bufferProgress()}}></div>
                        <div className="video-progress-bar" style={{width: playProgress()}}></div>
                    </div>
                    <div className="video-time"><span className="video-time__current">{config.utils.formatTime(currentTime)}</span>/<span className="video-time__duration">{config.utils.formatTime(duration)}</span></div>
                </div>
                <button className={`video-icon ${fullscreen?'full':'normal'}`} onClick={() => onToggleFullScrren()}></button>
            </div>
        );
    }
}

export default VideoControl;