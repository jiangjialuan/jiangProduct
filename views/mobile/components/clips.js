import React from 'react';
import {
	Link
} from 'react-router';

import './clips.scss';
import ajax from '../../common/js/ajax.js';
import config from '../config/common'; //公共配置文件
import auth from '../js/auth'; //权限验证

import Shop from './shop'; //商城组件
import Login from './login.js'; //登陆组件
import Packet from './packet/send.js'; //红包组件
import RobPacket from './packet/receive.js'; //红包组件
import ThumbsUp from './thumbs-up.js'; //点赞组件

let bLiveVideoTimer = null,
	videoList = [
		{
			length:323,
			width:640,
			height:360,
			profile:'http://yimiimg.artqiyi.com/short_video/profile1.png',
			poster:'http://yimiimg.artqiyi.com/short_video/poster1.png',
			src:'http://yimiimg.artqiyi.com/short_video/2/playlist.m3u8',
			thumbsup:100,
			name:'DAYI',
			codeImg:'http://yimiimg.artqiyi.com/short_video/code.png',
			title:'#channel DAYI##夏日清凉妆#'
		},
		{
			length:323,
			width:852,
			height:480,
			profile:'http://yimiimg.artqiyi.com/short_video/profile2.png',
			poster:'http://yimiimg.artqiyi.com/short_video/poster2.png',
			src:'http://yimiimg.artqiyi.com/short_video/1/playlist.m3u8',
			thumbsup:10,
			name:'DAYI',
			codeImg:'http://yimiimg.artqiyi.com/short_video/code.png',
			title:'UKISS唇部产品测评'
		}
	],currentVideo = 1,lastActiveTime = new Date().getTime();

class VideoClipsPage extends React.Component {

	constructor() {
		super();
		this.state={
			videoInfo:{}
		}
		this.onDocumentClick = this.onDocumentClick.bind(this);
	}

	onDocumentClick(e) {
		this.setState({
			showCode: false
		});
	}

    initControlInterval() {
        if (new Date().getTime() - lastActiveTime >= 3000) {
            this.setState({
            	showControl:false
            });
        }

        this.controlRequestFrame = window.requestAFrame(() => {
            this.initControlInterval();
        });
    }

    clearCheckInterval() {
        window.cancelAFrame(this.controlRequestFrame);
    }

	componentDidMount() {
        this.video.setAttribute("x5-video-player-type", "h5");
        this.video.setAttribute("x5-video-player-fullscreen", "true");
        this.video.setAttribute("playsinline", "true");
        this.video.setAttribute("webkit-playsinline", "true");
		this.toggleVideo();
	    var oLiveCanvas2D = this.canvas.getContext('2d');
	    this.video.addEventListener('play', ()=> {
    		this.drawImage(oLiveCanvas2D);
    		this.setState({
    			show:false
    		});
    		this.showControl();
    		this.initControl();
    		this.initControlInterval();
	    }, false);
	    this.video.addEventListener('timeupdate', ()=> {
    		this.setState({
    			currentTime:this.video.currentTime
    		});
	    }, false);
	    this.video.addEventListener('pause', ()=> {
	        this.clearVideoInterval();
	    }, false);
	    this.video.addEventListener('ended', ()=> {
	    	this.showPoster();
	        this.clearVideoInterval();
	    }, false);
	    this.poster.addEventListener('touchstart', (e)=> {
	        this.video.play();
	        this.hidePoster();
	    }, false);

	    this.codeImg.addEventListener('touchstart', (e)=> {
	        e.stopImmediatePropagation();
	    }, false);

	    this.initPageDrag();

	    document.addEventListener('touchstart', this.onDocumentClick, false);
	}

	//滑动页面切换视频
	initPageDrag(){
		let startY,lastY = 0;
	    this.videoContent.addEventListener('touchstart', (e)=> {
	    	startY = e.touches[0].pageY;
	    	lastY = 0;
	    }, false);
	    this.videoContent.addEventListener('touchmove', (e)=> {
	    	lastY = e.touches[0].pageY;
	    }, false);
	    this.videoContent.addEventListener('touchend', (e)=> {
	    	let offset = Math.abs(lastY - startY);
	    	if(offset >= 50 && lastY){
	    		this.toggleVideo();
	    	}
	    }, false);
	}

    initControl() {
        let lastX, currentX = 0,offsetX,
            percentage,{duration} = this.state;
        // 播放进度条拖动和点击
        this.videoSeek.addEventListener('touchstart', (e) => {
        	lastActiveTime = new Date().getTime();
            lastX = e.touches[0].pageX;
            currentX = 0;
        });
        this.videoSeek.addEventListener('touchmove', (e) => {
        	e.preventDefault();
        	lastActiveTime = new Date().getTime();
            if (isNaN(duration)) return;
            currentX = e.touches[0].pageX;
            percentage = (currentX - config.utils.offsetLeft(this.videoSeek)) / this.videoSeek.clientWidth;
            this.video.currentTime = percentage * duration;
        });
        this.videoSeek.addEventListener('touchend', (e) => {
        	lastActiveTime = new Date().getTime();
            if (isNaN(duration)) return;
            if (currentX == 0) {
                percentage = (lastX - config.utils.offsetLeft(this.videoSeek)) / this.videoSeek.clientWidth;
            } else {
                percentage = (currentX - config.utils.offsetLeft(this.videoSeek)) / this.videoSeek.clientWidth;
            }
            this.video.currentTime = percentage * duration;
        });
    }


	showPoster(){
        this.setState({
        	show:true
        });
	}

	hidePoster(){
        this.setState({
        	show:false
        });
	}

	componentWillUnmount() {
		this.clearCheckInterval();
		document.removeEventListener('touchstart', this.onDocumentClick, false);
	}

	drawImage(canvas){
		bLiveVideoTimer = setInterval(()=> {
            canvas.drawImage(this.video, 0, 0, this.state.videoInfo.width, this.state.videoInfo.height);
        }, 20);
	}

	clearVideoInterval(){
		clearInterval(bLiveVideoTimer);
		bLiveVideoTimer = null;
	}

	togglePlay(){
		if(this.video.paused){
			this.video.play();
		}else{
			this.video.pause();
		}
	}

    showControl() {
    	lastActiveTime = new Date().getTime();
        this.setState({
        	showControl:true
        });
    }

	// 点赞
	openThumpsUp() {
		if(this.state.praised) return;
		this.setState({
			praised:true,
			thumbsup:++this.state.thumbsup
		});
		this.ThumbsUp.addItem();
	}

	// 打开店鋪
	openShop(e) {
		e.nativeEvent.stopImmediatePropagation();
		this.Shop.show('/');
	}

	// 打开红包
	openPacket(e) {
		e.nativeEvent.stopImmediatePropagation();
		if (!auth.getUserInfo().isLogin) {
			this.Login.show(() => {
				this.Packet.show();
			});
		} else {
			this.Packet.show();
		}
	}

	showCode(e){
		e.nativeEvent.stopImmediatePropagation();
		this.setState({
			showCode:true
		});
	}

	// 切换视频
	toggleVideo(){
		if(currentVideo == 1){
			this.setState({
				videoInfo:videoList[1],
				thumbsup:10,
				praised:false,
				show:true,
				showControl:false,
				showCode:false,
				duration:videoList[1].length
			});
			currentVideo = 2;
		}else{
			this.setState({
				videoInfo:videoList[0],
				thumbsup:100,
				praised:false,
				show:true,
				showControl:false,
				showCode:false,
				duration:videoList[0].length
			});
			currentVideo = 1;
		}
		
        auth.wechatConfig(() => {
		    if(config.isIOS){
		    	this.video.play();
		    }        
			let {videoInfo} = this.state,
				shareInfo = {
				title: `${videoInfo.name}的小视频`,
				desc: `${videoInfo.title}`,
				imgUrl: `${videoInfo.profile}`,
				link: location.origin + location.pathname,
				type: 'video'
			}

			wx.showOptionMenu();
			//分享到朋友圈
			wx.onMenuShareTimeline({
				title: `${shareInfo.title}，${shareInfo.desc}`, // 分享标题
				link: shareInfo.link,
				imgUrl: shareInfo.imgUrl, // 分享图标
				type: shareInfo.type
			});

			//分享到好友
			wx.onMenuShareAppMessage(shareInfo);
			//分享到QQ
			wx.onMenuShareQQ(shareInfo);
			//分享到QQ空间
			wx.onMenuShareQZone(shareInfo);


        });
	}

    renderControl() {
    	if(!this.video) return;
    	let {currentTime,duration,showControl} = this.state,{buffered,paused} = this.video,
        playProgress = () =>{
            if (!this.video) return 0;
            let progress = currentTime / duration;
            return progress * 100 + '%';
        },
        bufferProgress = () =>{
            if (!this.video || buffered.length < 1) return 0;
            let progress = buffered.end(0) / duration;
            return progress * 100 + '%';
        };

        return (
            <div className={showControl?'video-controls':'video-controls hidden'}>
                <button className={paused?"video-play video-icon":"video-icon"} onClick={this.togglePlay.bind(this)}></button>
                <div className="video-seek" ref={videoSeek => this.videoSeek = videoSeek}>
                    <div className="video-seek__container">
                        <div className="video-buffer-bar" style={{width: bufferProgress()}}></div>
                        <div className="video-progress-bar" style={{width: playProgress()}}></div>
                    </div>
                	<div className="video-time"><span className="video-time__current">{config.utils.formatTime(currentTime)}</span>/<span className="video-time__duration">{config.utils.formatTime(duration)}</span></div>
                </div>
            </div>
        );
    }

	render() {
		let {videoInfo,show,thumbsup,praised,showCode} = this.state;
		return (
			<div className="video-box page">
				<header>
					<div className="star-profile">
						<img src={videoInfo.profile} class='profile-img' className='fl'/>	
						<div className='star-name fl'>
							{videoInfo.name}
							<p>1000人看过</p>
						</div>
						<div className="focus-btn btn fl" onClick={this.showCode.bind(this)}>
							关注
						</div>
					</div>
	            </header>
	            <img src={videoInfo.codeImg} className={showCode?'code':'hidden'} ref={codeImg => this.codeImg = codeImg}/>
			    <div className='video-content' ref={content => this.videoContent = content}>
	            	<div className="pullUp"></div>
			    	<div className="content">
				    	<img src={videoInfo.poster} ref={poster => this.poster = poster} className={show?'poster':'hidden'}/>
			            <canvas width={videoInfo.width} height={videoInfo.height} ref={canvas => this.canvas = canvas} onClick={this.showControl.bind(this)}></canvas>
			            <div className="video-player">
				            <video ref={video => this.video = video} preload="auto" src={videoInfo.src} ></video>
				            {this.renderControl()}
			            </div>
			    		<div className="video-title">{videoInfo.title}</div>
			    	</div>
	            	<div className="pullDown"></div>
		        </div>
           		<Login
           			ref={Login => this.Login = Login}
           			roomid={this.props.params.uid}
       			/>
       			<Shop 
           			ref={Shop => this.Shop = Shop}
           			uid={6}
           			unAuth={e => this.Login.show(() => {
						this.Shop.reloadPage();
					})}
       			/>
       			<Packet 
       				ref={Packet => this.Packet = Packet}
   				/>
       			<RobPacket
       				ref={RobPacket => this.RobPacket = RobPacket} 
       				unAuth={e => this.Login.show()}
   				/>
		        <footer>
	                <div className={`icon praise-icon ${praised?'praised':''}`} onClick={this.openThumpsUp.bind(this)}>
	                	<ThumbsUp
							ref={ThumbsUp => this.ThumbsUp = ThumbsUp}
							praised={praised}
						/>
	                	喜欢 {thumbsup}
	                </div>
	                <div className="icon packet-icon" onClick={this.openPacket.bind(this)}>
	                	打赏 100
	                </div>
	                <div className="icon shop-icon" onClick={this.openShop.bind(this)}>
	                	商品 10
	                </div>
	            </footer>
			</div>
		);
	}
}

module.exports = VideoClipsPage;