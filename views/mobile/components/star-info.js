import {Component} from 'react';
import {Link} from 'react-router';
import InfiniteScroll from 'react-infinite-scroller';

import auth from '../js/auth'; //权限验证
import ajax from '../../common/js/ajax.js';
import config from '../config/common'; //公共配置文件
import Shop from './shop'; //商城组件
import Login from './login.js'; //登陆组件
import UserIndex from './usercenter/index.js'; //用户中心
import Qrcode from './qrcode'; //二维码

import './star-info.scss';
let lastEnterTime = new Date().getTime();
class StarInfoPage extends Component {
	constructor() {
		super();
		this.state = {
			videoInfo:{
				list:[],
				page:1,
				hasNext:true,
				totalCount:0
			},
			clipInfo:{
				list:[],
				page:1,
				hasNext:true,
				totalCount:0
			},
			starInfo: {},
			overflowClass:'overflow-hidden',
			viewClass:'',
			loading: false,
			type:'clip'
		};

	}

	componentWillUnmount() {
		clearInterval(this.statusInterval);
		this.statusInterval = null;
	}

	// 判断是否直播状态
	checkStatus() {
		ajax.get(`${config.baseUrl}/api/v1/is_online?roomId=${this.props.params.uid}`)
			.done(data => {
				this.setState({
					isOnline: data.is_online
				});
			});
	}

	componentDidMount() {
		this.getStarInfo();
		this.checkStatus();
		this.statusInterval = setInterval(() => {
			this.checkStatus();
		}, 5 * 1000);
		auth.wechatConfig(() => {
			wx.hideOptionMenu();
		});
	}

	initPageContentScroll(){
		let currentY = 0,
			lastY,
			offsetY,
			scrollTop;
		this.pageContent.addEventListener('touchstart', (e) => {
			scrollTop = this.pageContent.scrollTop;
			lastY = e.touches[0].pageY;
            currentY = 0;
        },false);
        this.pageContent.addEventListener('touchmove', (e) => {
        	currentY = e.touches[0].pageY;
            offsetY = currentY - lastY;
        },false);
        this.pageContent.addEventListener('touchend', (e) => {
        	let {overflowClass} = this.state;
        	if(currentY == 0) return;
        	if(overflowClass == 'overflow-hidden'){
        		if(offsetY < 0){
    				this.changeContentHeigt();
        		}
        	}else{
        		if(scrollTop == 0 && offsetY > 0){
        			this.changeContentHeigt();
        		}
        	}
        },false);
	}

	//改变头像区域高度 竖屏
	changeContentHeigt(){
		let {videoInfo,viewClass,overflowClass} = this.state;
		if(videoInfo.width > videoInfo.height) return;		
		if(viewClass == ''){
			viewClass = 'min-view';
			overflowClass = '';
		}else{
			viewClass = '';
			overflowClass = 'overflow-hidden';
		}
		this.setState({
			viewClass:viewClass,
			overflowClass:overflowClass
		});
	}

	// 获取回放列表
	getVideoData() {
		let {videoInfo,type,loading} = this.state,
			{uid} = this.props.params;
		if (type != 'video' || loading) return;
		this.setState({
			loading:true
		});
		ajax.get(`${config.baseUrl}/api/v1/play_list?roomId=${uid}&page=${videoInfo.page}`)
			.done(data => {
				this.setState({
					videoInfo:{
						list:videoInfo.list.concat(data.list),
						hasNext: videoInfo.page < data.total_page,
						page: videoInfo.page + 1,
						totalCount: data.total_count
					}
				});
			})
			.always(res => {
				this.setState({
					loading:false
				});
			});
	}

	// 获取短视频列表
	getClipsData() {
		let {clipInfo,type,loading} = this.state,
			{uid} = this.props.params;
		if (type != 'clip' || loading) return;
		this.setState({
			loading:true
		});
		ajax.get(`${config.baseUrl}/api/v1/short_video_list?uid=${uid}&page=${clipInfo.page}`)
			.done(data => {
				this.setState({
					clipInfo:{
						list:clipInfo.list.concat(data.list),
						hasNext: clipInfo.page < data.total_page,
						page: clipInfo.page + 1,
						totalCount: data.total_count
					}
				});
			})
			.always(res => {
				this.setState({
					loading:false
				});
			});
	}

	// 获取主播信息
	getStarInfo() {
		let {uid} = this.props.params;
		ajax.get(`${config.baseUrl}/api/v1/zbinfo?roomId=${uid}`)
			.done(data => {
				this.setState({
					starInfo: data
				});
				config.utils.setTitle(data.name + "的首页");
				this.setState({
					userCenterComponent: <UserIndex 
						           			ref={center => this.UserCenter = center}
						           			isShowShop={data.is_show_shop}
						           			order={e => this.Shop.show('/order-list')}
						           		/>,
					shopComponent: 	<Shop 
					           			ref={shop => this.Shop = shop}
					           			starid={uid}
					           			login={(cb) => this.Login.show(cb)}
					       			/>
				});
				this.initPageContentScroll();
			});
	}

	// 渲染直播状态
	renderLiveStatus() {
		let {isOnline,videoList,starInfo,loading} = this.state,
			{uid} = this.props.params;
		if (typeof isOnline == 'undefined') return;
		let videoInfo,
			playStr = <Link className="fl live-status online" to={`/play/${uid}`} key={uid} onClick={this.forceUpdate}><div className="online-loading"><span></span><span></span><span></span></div>直播中</Link>;
		if (isOnline == 0) {
			playStr = <div className="fl live-status offline">休息中</div>;
		}
		return playStr;
	}

	// 打开个人中心
	openUserCenter() {
		if (!auth.getUserInfo().isLogin) {
			this.Login.show(() => {
				this.UserCenter.show();
			});
		} else {
			this.UserCenter.show();
		}
	}

	changeTab(type){
		let {loading} = this.state;
		if(loading) return;
		this.setState({
			type:type
		});
	}

	render() {
		let {videoInfo,clipInfo,starInfo,loading,type,showCode,userCenterComponent,overflowClass,viewClass,shopComponent} = this.state,
			{uid} = this.props.params;
		return (
			<div className='star-info-page page'>
			    <div className='user-profile' onClick={() => this.openUserCenter()}></div>
			    <div className={`star-profile ${viewClass}`}>
			    	<div className="bg"></div>
			    	<div className="profile-content">
			            <img src={starInfo.head_pic}/>
			            <div className="user-name">{starInfo.name}</div>
			            <div className="profile-tool">
			            	{starInfo.qrcode?
			            		<a className="fl live-status wechat" onClick={() => this.Qrcode.show()}>微信</a>
			            		:''
			            	}
							{this.renderLiveStatus()}
			            </div>
			    	</div>
			    </div>
                <ul className="nav-tab">
                	<li	className={type=='clip'?'tab-item active':'tab-item'} onClick={this.changeTab.bind(this,'clip')}>短视频</li>
                	<li	className={type=='video'?'tab-item active':'tab-item'} onClick={this.changeTab.bind(this,'video')}>直播回放</li>
                	<li	className={type=='desc'?'tab-item active':'tab-item'} onClick={this.changeTab.bind(this,'desc')}>简介</li>
                </ul>
                <div className={`page-content ${overflowClass}`} ref={content => this.pageContent = content}>
                    <InfiniteScroll 
                    	loadMore={this.getClipsData.bind(this)} 
                    	hasMore={clipInfo.hasNext} 
                    	useWindow={false} 
                    	threshold={30}
                    	className={type=='clip'?'tab-content clip-list':'tab-content'}>
                		{clipInfo.list.map((item,index) => { 
                			return (
			                    <Link className="video-item clearfix" to={`/video/${item.id}`} key={index} onClick={this.forceUpdate}>
			                    	<img src={item.cover}/>
			                    	<div className="play-btn"></div>
			                    	<div className="item-title">{item.title}</div>
			                    </Link>
                    		);
                    	})}
                    	{!loading && clipInfo.list.length == 0 ? <div className="loading"> (⊙ˍ⊙) 哎哟，这里空空如也…</div>:''}
                		<div className="loading">{loading?'正在加载中...':''}</div>
                    </InfiniteScroll>
                    <InfiniteScroll 
                    	loadMore={this.getVideoData.bind(this)} 
                    	hasMore={videoInfo.hasNext} 
                    	useWindow={false} 
                    	threshold={30}
                    	className={type=='video'?'tab-content video-list':'tab-content'}>
                		{videoInfo.list.map((item,index) => { 
                			return (
			                    <Link className="video-item clearfix" to={`/playback/${item.uid}/${item.vid}`} key={index} onClick={this.forceUpdate}>
				                    <div className="item-info fl">
				                        <div className="item-name">{item.title}</div>
				                        <p><span className="item-date">{item.create_time}</span><span className='item-timelength'>时长：{config.utils.formatTime(item.vlen)}</span></p>
				                    </div>
				                    <div className='item-viewer fr'>
				                        <p><span className='viewer-num'>{item.views}</span>人</p>
				                        <p>看过</p>
				                    </div>
			                    </Link>
                    		);
                    	})}
                    	{!loading && videoInfo.list.length == 0 ? <div className="loading"> (⊙ˍ⊙) 哎哟，这里空空如也…</div>:''}
                		<div className="loading">{loading?'正在加载中...':''}</div>
                    </InfiniteScroll>
                    <div className={type=='desc'?'tab-content video-desc':'tab-content'}>
                    	<pre>{starInfo.introduction||'该主播太懒，什么都没留下……'}</pre>
                    </div>
				</div>
			    <Login 
			    	ref={login=> this.Login = login} 
		    	/>
		    	{userCenterComponent}
   				{starInfo.qrcode?
   					<Qrcode
	   					ref={qrcode => this.Qrcode = qrcode}
	   					src={starInfo.qrcode}
	   				/>	
	   				:''
   				}
   				{shopComponent}
			</div>
		);
	}
}

module.exports = StarInfoPage;