import React from 'react';
import {Link} from 'react-router';
import socket from './im';
import config from '../config/common'; //公共配置文件
import ajax from '../../common/js/ajax';
import auth from '../js/auth'; //权限验证

import Shop from './shop'; //商城组件
import VideoPlayer from './video-player'; //视频播放组件
import ThumbsUp from './thumbs-up.js'; //点赞组件
import Packet from './packet/send.js'; //红包组件
import RobPacket from './packet/receive.js'; //红包组件
import Login from './login.js'; //登陆组件
import ChatBox from './chat-box.js'; //公聊组件
import ChatInput from './chat-input.js'; //公聊组件
import PrivateChatBox from './private-chat-box.js'; //私聊组件
import ChatListBox from './chat-list-box.js'; //私聊列表
import UserIndex from './usercenter/index.js'; //用户中心

import './play.scss';
let starInfo = {},
	videoInfo = {},
	lastEnterTime = new Date().getTime();
class VideoPage extends React.Component {
	constructor() {
		super();
		this.state = {
			users: 0, //观众人数
			loading: true
		};
	}

	getStarInfo(roomid) {
		return ajax.get(`${config.baseUrl}/api/v1/zbinfo?roomId=${roomid}`)
	}

	// 判断是否直播状态
	checkStatus(roomid) {
		return ajax.get(`${config.baseUrl}/api/v1/is_online?roomId=${roomid}`)
	}

	// 初始化socket
	initSocket() {
		socket.onMsg('chat', (data, cb) => {
			if (typeof data.toUid == 'undefined') { //公聊信息
				this.ChatBox.onMsg('chat',data,cb);
			}else{
				this.ChatListBox && this.ChatListBox.onMsg('chat',data,cb);
				this.PrivateChatBox.onMsg('chat',data,cb);
			}
		});
		socket.onMsg('typing', (data, cb) => {
			this.PrivateChatBox.onMsg('typing',data,cb);
		});
		socket.onMsg('stoptyping', (data, cb) => {
			this.PrivateChatBox.onMsg('stoptyping',data,cb);
		});
		socket.onMsg('recommendGoods', (data) => {
			this.Shop.onMsg('recommendGoods',data);
		});
		socket.onMsg('redEnvelope', data => {
			this.RobPacket.onMsg('redEnvelope',data);
		});
		// 用户发送私包
		socket.onMsg('privateRedEnvelope', data => {
			this.RobPacket.onMsg('privateRedEnvelope',data);
		});
		socket.onMsg('reconnect', () => {
			let userInfo = auth.getUserInfo(),
				{roomid} = this.props.params;
			socket.connectSocket(userInfo.userid, userInfo.username, roomid);
		});
		socket.onMsg('stoplive', (data) => {
			if (data.live_status == 'stop') {
				this.setState({
					isLiving: 0
				});
			}
			this.videoPlayer.dealWithStopLive(data);
		});
		socket.onMsg('newliveurl', data => {
			this.setState({
				isLiving: 1
			});
			this.videoPlayer.dealWithNewLiveUrl(data);
		});
		socket.onMsg('userjoin', data => {
			let thumbsUpNumber = config.utils.dealWithCount({
									number: data.thumbsup_number,
									basic: 10000,
									unit: '万',
									toFixed: 1
								});
			this.setState({
				users: data.numUsers,
				thumbsUpComponent: <ThumbsUp
										ref={thumbs => this.ThumbsUp = thumbs}
										number={thumbsUpNumber}
										emitMsg={(type,data,cb) => socket.emitMsg(type,data,cb)}
									/>
			});
			if (auth.getUserInfo().userid == data.uid) { //如果是本人登陆
				socket.emitMsg('newMessage', {
					isStar: config.isArtqiyi ? 1 : 0
				});
			}
		});
		socket.onMsg('userjoin', data => {
			lastEnterTime = new Date().getTime();
			this.setState({
				welcomeMsg: <span className="info">{data.username} 来了</span>
			});
		});
		socket.onMsg('userleft', data => {
			this.setState({
				users: data.numUsers
			});
		});
		socket.onMsg('sensitivewords', data => {
			clearTimeout(this.sensitiveTimeout);
			this.sensitiveTimeout = null;
			this.setState({
				sensitivewords: <p><span style={{color:'#f00'}}>系统消息：</span>你发送的为敏感字:<span style={{color:'#f00'}}>{data.message}</span></p>
			});
			this.sensitiveTimeout = setTimeout(() => {
				this.setState({
					sensitivewords: ""
				});
			}, 3 * 1000);
		});
		socket.onMsg('newMessage', data => {
			this.setNewMsg(data.unread_num)
		});
		socket.onMsg('thumbsUp', (data) => {
			this.ThumbsUp.addItemToList(data.thumbsup_number);
		});
		socket.isConnected = 1;
		// 公聊相关socket
		socket.onMsg('init_group_msg', (data, cb) => {
			this.ChatBox.onMsg('init_group_msg',data,cb);
		});
		// // 抢到红包
		socket.onMsg('gainRedEnvelope', data => {
			this.ChatBox.onMsg('gainRedEnvelope',data);
		});
		socket.onMsg("init_msg", data => {
			this.PrivateChatBox.onMsg('init_msg',data);
		});
		socket.onMsg("chatlist", data => {
			this.ChatListBox.onMsg('chatlist',data);
		});
	}

	setNewMsg(num) {
		this.setState({
			hasNewMsg: num
		});
	}

	connectSocket(){
		let userInfo = auth.getUserInfo(),
			{roomid} = this.props.params;
		socket.onMsg('connect', socket.connectSocket(userInfo.userid, userInfo.username, roomid));
	}

	getUserName() {
		let {roomid} = this.props.params;
		this.getStarInfo(roomid).done(data => {
			auth.setStarInfo(data);
			starInfo = data;
			videoInfo.url = data.hls_play_url;
			config.utils.setTitle(data.name + "的直播间");
			this.connectSocket();

			if(config.isArtqiyi) return;
			this.setState({
				userCenterComponent: <UserIndex 
					           			ref={center => this.userCenter = center}
					           			isShowShop={data.is_show_shop}
					           			order={e => this.Shop.show('/order-list')}
					           		/>,
           		videoPlayer:<VideoPlayer
								ref={player => this.videoPlayer = player}
								type='live'
						    	src={videoInfo.url} 
						    	status={videoInfo.status} 
						    />	
			});
		});
	}

	// 渲染进房信息
	renderEnterRoomMsg() {
		let offsetTime = new Date().getTime() - lastEnterTime;
		if (offsetTime >= 3000) {
			this.setState({
				welcomeMsg: ''
			});
		}
		this.enterRoomFrame = window.requestAFrame(() => {
			this.renderEnterRoomMsg();
		});
	}

	componentDidMount() {
		let {roomid} = this.props.params;
		this.renderEnterRoomMsg();

		// 首先检测是否正在直播
		this.checkStatus(roomid)
			.done(data => {
				videoInfo.status = data.is_online;
				this.setState({
					isLiving: data.is_online,
					loading: false
				});
				this.getUserName();
			});

		this.initSocket();

		auth.wechatConfig(() => {
			let shareInfo = {
				title: `${starInfo.name}开了一场直播`,
				desc: `${starInfo.room_name||'画面太美，速度来围观.....'}`,
				imgUrl: `${starInfo.head_pic}`,
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
			wx.hideMenuItems({
				menuList: [
					'menuItem:readMode', // 阅读模式
					'menuItem:setFont', // 字体大小
					'menuItem:copyUrl' // 复制链接
				]
			});
		});
	}

	componentWillUnmount() {
		window.cancelAFrame(this.enterRoomFrame);
	}

	// 打开私聊
	openMessage(e) {
		let {roomid} = this.props.params;
		if (config.isArtqiyi) { //如果是主播
			this.ChatListBox.show();
		} else {
			this.PrivateChatBox.show(roomid, starInfo.name);
		}
	}

	// 打开红包
	openPacket() {
		if (!auth.getUserInfo().isLogin) {
			this.Login.show(() => {
				this.connectSocket();
				this.Packet.show();
			});
		} else {
			this.Packet.show();
		}
	}

	// 打开个人中心
	openUserCenter() {
		if (!auth.getUserInfo().isLogin) {
			this.Login.show(() => {
				this.connectSocket();
				this.userCenter.show();
			});
		} else {
			this.userCenter.show();
		}
	}

	// 打开商城
	openShop(e) {
		e.nativeEvent.stopImmediatePropagation();
		this.Shop.show('/');
	}

	//正在加载中
	renderLoading() {
		if (config.isArtqiyi) return;
		let {
			loading,
			isLiving
		} = this.state, className = 'page-loading hidden page-content';
		// 正在加载中
		if (loading || typeof isLiving == 'undefined') {
			className = 'page-loading page-content';
		}

		return (
			<div className={className}>
				<p>	
					精彩即将开始
				</p>
			</div>
		);
	}

	// 直播结束
	renderNoResult() {
		let {roomid} = this.props.params;
		if (config.isArtqiyi) return;
		let {
			loading,
			isLiving
		} = this.state;
		if (!loading && isLiving == 0) {
			this.props.router.push(`/index/${roomid}`);
		}
	}

	render() {
		let {loading,isLiving,userCenterComponent,thumbsUpComponent,videoPlayer} = this.state,
			className = 'page-living hidden page-content',
			{roomid} = this.props.params;
		if (!loading && typeof isLiving != 'undefined' && isLiving != 0) {
			className = 'page-living page-content';
			if (config.isArtqiyi) {
				className = 'page-living page-content';
			}
		}

		let userInfoStr =
			(
				<header className="clearfix">
					<Link className="user-info fl" to={`/index/${roomid}`} key={roomid} onClick={this.forceUpdate}>
                		<p className="user-name">{starInfo.name}</p>
	                	<p>
	                		<span className="icon i-location fl">{starInfo.city}</span>
							<span className="icon i-viewer fl">{this.state.users}人</span>
	                	</p> 
                	</Link>
                	<div className="i-user fl" onClick={() => this.openUserCenter()}></div>
                </header>
			);
		if (config.isArtqiyi) {
			userInfoStr = (
				<header className="clearfix">
					<div className="user-info fl" >
	                	<p className="user-name">{starInfo.name}</p>
	                	<p>
	                		<span className="icon i-location fl">{starInfo.city}</span>
							<span className="icon i-viewer fl">{this.state.users}人</span>
	                	</p> 
	                </div>
                </header>
			);
		}

		return (
			<div id="video-box" className='page'>
				{config.isArtqiyi ? '':<div className='bg'/>}
				{this.renderLoading()}
				{this.renderNoResult()}
				<div className={className}>
					{userInfoStr}
					<div className='welcome-tips'>
						{this.state.welcomeMsg}
					</div>
				    {videoPlayer}
					{!config.isArtqiyi?'':
					<ChatListBox 
						ref={chatListBox => this.ChatListBox = chatListBox}
						emitMsg={(type,data,cb) => socket.emitMsg(type,data,cb)}
						openChatBox={(uid, username) => this.PrivateChatBox.show(uid, username)}/>}
					<PrivateChatBox
						ref={privateChatBox => this.PrivateChatBox = privateChatBox} 
						emitMsg={(type,data,cb) => socket.emitMsg(type,data,cb)}
						newMsg={(num) => this.setNewMsg(num)}
						openChatList={() => this.ChatListBox.show()}
					/>
	           		<Login
	           			ref={login => this.Login = login}
	           			roomid={roomid}
           			/>
					{userCenterComponent}
	       			<Packet 
	       				ref={packet => this.Packet = packet}
       				/>
	           		<div className="sensitivewords">
	       				{this.state.sensitivewords||''}
	       			</div>
	       			<div className="content-wrap">
		       			<RobPacket
		       				ref={robPacket => this.RobPacket = robPacket} 
		       				login={e => this.Login.show()}
	       				/>
	           			<ChatBox
							ref={chatBox => this.ChatBox = chatBox} 
							uid={roomid}
							openChatBox={(uid, username) => this.PrivateChatBox.show(uid, username)}
						/>
						{starInfo.is_show_shop == 1?
		           		<Shop 
		           			ref={shop => this.Shop = shop}
		           			starid={roomid}
		           			emitMsg={(type,data) => socket.emitMsg(type,data)}
		           			login={(cb) => this.Login.show(cb)}
	           			/>:''}
	       			</div>
					<div className="toolbar-wrap">
						{starInfo.is_show_shop == 1?
		                	<div className="icon i-shop" onClick={this.openShop.bind(this)}>
		                		<i className="cart-num"></i>
		                	</div>
							:''	
						}
						<div className="input-tips" onClick={() => this.ChatInput.show()}>说点什么吧...</div>
	                	<div className={this.state.hasNewMsg?"icon i-message i-new":"icon i-message"} onClick={() => this.openMessage()}/>
	                	{starInfo.is_show_redenvelope == 1?
		                	<div className="icon i-packet" onClick={() => this.openPacket()}/>
							:''	
						}
	                	<div className="icon i-praise" onClick={e => this.ThumbsUp.addItem()}>
	                		{thumbsUpComponent}
	                	</div>
		            </div>
           			<ChatInput
	       				ref={chatInput => this.ChatInput = chatInput}
	       				roomid={roomid}
	       				emitMsg={(type,data) => socket.emitMsg(type,data)}
	       			/>
				</div>
			</div>
		)
	}
}
module.exports = VideoPage;