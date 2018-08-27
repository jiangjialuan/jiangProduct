import React from 'react';
import { Link } from 'react-router';
import ajax from '../../common/js/ajax.js';
import config from '../config/common'; //公共配置文件
import auth from '../js/auth'; //权限验证
import Shop from './shop'; //商城组件
import Login from './login.js'; //登陆组件
import Packet from './packet/send.js'; //红包组件
import Comment from './comment.js'; //红包组件
import RobPacket from './packet/receive.js'; //红包组件
import ThumbsUp from './thumbs-up.js'; //点赞组件
import InfiniteScroll from 'react-infinite-scroller';
import VideoPlayer from './video-player'; //视频播放组件
import Qrcode from './qrcode'; //二维码

import './short-video.scss';
let lastGoodsTime = null;
class ShortVideoPage extends React.Component {
	constructor() {
		super();
		this.state={
			videoInfo:{},
			viewClass:'',
			overflowClass:'',
			commentInfo:{
				page: 1,
				hasNext: true,
				list: [],
				totalCount: 0
			},
			starInfo: {},
			loading: false,
			init: false,
			shopComponent:null
		}
	}

    initGoodsInterval() {
        this.goodsRequestFrame = window.requestAFrame(() => {
            this.initGoodsInterval();
        });
        if(!lastGoodsTime) return;
        if (new Date().getTime() - lastGoodsTime >= 3000) {
            this.VideoPlayer.props.shopStr = (
				<div className="clearfix shop-area">
                    <div className="icon shop-icon fr" onClick={() => this.openShop()}>视频同款</div>
                </div>
			);
			lastGoodsTime = null;
        }
    }

    componentWillUnmount() {
    	window.cancelAFrame(this.goodsRequestFrame);
    }

	getVideoInfo(videoId) {
		return ajax.get(`${config.baseUrl}/api/v1/short_video_info?svid=${videoId}&act=11`);
	}

	componentDidMount() {
		let {vid} = this.props.params,
			{goodsItem,shopStr} = this.state;
		this.getVideoInfo(vid)
			.done(data => {
				this.setState({
					init:true
				});
				if(!data.uid) return;
				let thumbsUpNumber = config.utils.dealWithCount({
						number: data.thumbsup_number,
						basic: 10000,
						unit: '万',
						toFixed: 1
					}),shopStr = (
						<div className="clearfix shop-area">
	                        <div className="icon shop-icon fr" onClick={() => this.openShop()}>视频同款</div>
	                    </div>
					);

				this.setState({
					videoInfo: data,
					duration:data.length,
					praised:data.is_thumbsup,
					shopComponent: <Shop 
					           			ref={shop => this.Shop = shop}
					           			starid={data.uid}
					           			title='视频同款'
					           			svid={vid}
					           			login={(cb) => this.Login.show(cb)}
					       			/>,
	       			thumbsUpComponent: <ThumbsUp
										ref={thumbs => this.ThumbsUp = thumbs}
										praised={data.is_thumbsup}
										vid={vid}
										number={thumbsUpNumber}
									/>,
					videoPlayer:<VideoPlayer
									ref={player => this.VideoPlayer = player}
							    	src={data.url} 
							    	duration={data.length} 
							    	width={data.width}
							    	height={data.height}
							    	cover={data.cover}
					 				showControl
					 				shopStr={shopStr}
					 				timeUpdate={(time) => this.recommandGoods(time)}
							    />				
				});
				this.setContentHeigt();
	    		this.initPageContentScroll();
	    		this.initWeChat();
				this.initGoodsInterval();	
				config.utils.setTitle(data.name);
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

	// 初始设置视频区域高度
	setContentHeigt(){
		let {videoInfo,viewClass,overflowClass} = this.state;
		// 横屏视频
		if(videoInfo.width > videoInfo.height){
			viewClass = '';
		}else{
			viewClass = 'max-view';
			overflowClass = 'overflow-hidden';
		}	
		this.setState({
			viewClass:viewClass,
			overflowClass:overflowClass
		});
	}

	//改变视频区域高度 竖屏
	changeContentHeigt(){
		let {videoInfo,viewClass,overflowClass} = this.state;
		if(videoInfo.width > videoInfo.height) return;		
		if(viewClass == 'max-view'){
			viewClass = 'min-view';
			overflowClass = '';
		}else{
			viewClass = 'max-view';
			overflowClass = 'overflow-hidden';
		}
		this.setState({
			viewClass:viewClass,
			overflowClass:overflowClass
		});
	}

	// 推荐商品
	recommandGoods(currentTime){
		if(currentTime == 'end'){
			this.VideoPlayer.props.shopStr = (
				<div className="clearfix shop-area">
                    <div className="icon shop-icon fr" onClick={() => this.openShop()}>视频同款</div>
                </div>
			);
		}else{
			let {videoInfo} = this.state,
				goodsList = videoInfo.show_goods;
			if(goodsList.length > 0){
				let goodsItem = goodsList.find((item)=>item.show_time == parseInt(currentTime, 10));
				if(goodsItem){
					this.VideoPlayer.props.shopStr = (
						<div className="clearfix shop-area">
							<div className="promote-goods" onClick={() => this.Shop.show(`/detail/${goodsItem.goods_id}`)}>
							    <div className="goods-name text-over-ellipsis">{goodsItem.goods_name}</div>
							    <div className="tirangle"></div>
							</div>
	                        <div className="icon shop-icon fr" onClick={() => this.openShop()}>视频同款</div>
	                    </div>
					);
					lastGoodsTime = new Date().getTime();
				}
			}	
		}

	}

	// 点赞
	openThumpsUp() {
		let {praised} = this.state;
		if (!auth.getUserInfo().isLogin) {
			this.Login.show(() => {
				this.Shop.onLogin();
				this.ThumbsUp.addItem(() => {
					this.setState({
						praised:1
					});
				});
			});
		} else {
			if(praised) return;
			this.ThumbsUp.addItem(() => {
				this.setState({
					praised:1
				});
			});
		}
	}

	// 打开店鋪
	openShop() {
		this.Shop.show('/');
	}

	// 打开评论
	openComment() {
		// 如果是微信
		if(config.isWechat && !auth.getUserInfo().username){
			location.href = 'http://yimipay.artqiyi.com/weixin/weixin/checkoauth?redirect=' + encodeURIComponent(location.origin + location.pathname);	
		}else{
			if (!auth.getUserInfo().isLogin) {
				this.Login.show(() => {
					this.Shop.onLogin();
					this.Comment.show();
				});
			} else {
				this.Comment.show();
			}
		}
	}

	// 打开红包
	openPacket() {
		if (!auth.getUserInfo().isLogin) {
			this.Login.show(() => {
				this.Shop.onLogin();
				this.Packet.show();
			});
		} else {
			this.Packet.show();
		}
	}

	// 初始化微信分享相关
	initWeChat(){
        auth.wechatConfig(() => {
			let {videoInfo} = this.state,
				shareInfo = {
				title: `${videoInfo.share_title}`,
				desc: `${videoInfo.share_desc}`,
				imgUrl: `${videoInfo.cover}`,
				link: location.origin + location.pathname,
				type: 'video'
			}
			wx.showOptionMenu();
			//分享到朋友圈
			wx.onMenuShareTimeline({
				title: `${shareInfo.title} | ${shareInfo.desc}`, // 分享标题
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

	// 获取评论列表
	getData() {
		let {loading,commentInfo} = this.state,
			{vid} = this.props.params;
		if (loading) return;
		this.setState({
			loading:true
		});
		ajax.get(`${config.baseUrl}/api/v1/video_comment_list`,{
			svid:vid,
			page:commentInfo.page
		}).done(data => {
			this.setState({
				commentInfo:{
					list:commentInfo.list.concat(data.list),
					hasNext: commentInfo.page < data.total_page,
					page: commentInfo.page + 1,
					totalCount: data.total_count
				}
			});
		}).always(res => {
			this.setState({
				loading:false
			});
		});
	}

	renderComment(data){
		let {commentInfo} = this.state;
		commentInfo.list = [].concat(JSON.parse(data)).concat(commentInfo.list);
		commentInfo.totalCount++;
		this.setState({
			commentInfo:commentInfo
		});
		this.pageContent.scrollTop = 0;
	}

	// 更新评论信息
	updateComment(type,data){
		if(type == 1){//普通的评论
			this.renderComment(data);
		}if(type == 2){
			ajax.post(`${config.baseUrl}/api/v1/pay_comment`,{
				act:11,
				order_id:data.order_id
			}).done(item => {
				this.renderComment(JSON.stringify(item));
			});
		}
	}

	render() {
		let {videoInfo,praised,commentInfo,loading,shopComponent,thumbsUpComponent,videoPlayer,viewClass,overflowClass,init} = this.state,
			{vid} = this.props.params;
		if(!videoInfo.uid && init) {
			return (
				<div className="video-box page">
					<div className='bg'/>
					<div className="no-result">
						(⊙ˍ⊙) 该视频被外星人抓走了
					</div>
				</div>
			);
		}
		return (
			<div className="video-box page">
			    <div className={`video-content ${viewClass}`}>
			    	{videoPlayer}
		        </div>
		        <div className={`page-content ${overflowClass}`} ref={content => this.pageContent = content}>
		        	<InfiniteScroll 
			        	loadMore={this.getData.bind(this)} 
			        	hasMore={commentInfo.hasNext} 
			        	useWindow={false} 
			        	threshold={30}>
			    		<div className="video-title">{videoInfo.title}</div>
						<div className="star-profile">
							<div className="profile-img fl">
								<img src={videoInfo.head_pic}/>	
							</div>
							<Link className='star-name fl' to={`/index/${videoInfo.uid}`} onClick={this.forceUpdate}>
								{videoInfo.name}
							</Link>
							<div className="fr">
				   				{videoInfo.qrcode?
				   					<div className="focus-btn btn fl" onClick={() => this.Qrcode.show()}>关注</div>
					   				:''
				   				}
								<div className="toggle-btn fl hidden">
									换一个
								</div>
							</div>
						</div>
		                <div className="comment-list">
		            		<div className="comment-title">热门评论（{commentInfo.totalCount}）</div>
				    		{commentInfo.list.map((item,index) => { 
				    			return (
				                    <div className="comment-item" key={index}>
					                    <div className="item-info clearfix">
					                        <div className="item-name fl">{item.username}</div>
					                        <span className="item-date fr">{config.utils.dealWithDate(item.create_time)}</span>
					                    </div>
				                        <pre className={`item-content ${item.type?'item-packet':''}`}>
				                        	{item.content}
				                        </pre>
				                        <img src={item.head_pic} className='item-img'/>
				                    </div>
				        		);
				        	})}
		            		{!loading && commentInfo.list.length == 0 ? <div className="no-data" onClick={() => this.openComment()}>暂无评论，点击抢沙发</div>:''}
	                		<div className="loading">{loading?'正在加载中...':''}</div>
						</div>		
					</InfiniteScroll>
		        </div>
           		<Login
           			ref={login => this.Login = login}
       			/>
       			{shopComponent}
       			<Comment
       				ref={comment => this.Comment = comment}
       				vid={vid}
       				onSuccess={(data) => this.updateComment(1,data)}
       			/>
       			<Packet 
       				ref={packet => this.Packet = packet}
       				vid={vid}
       				onSuccess={(type,data) => this.updateComment(type,data)}
   				/>
       			<RobPacket
       				login={e => this.Login.show()}
   				/>
   				{videoInfo.qrcode?
   					<Qrcode
	   					ref={qrcode => this.Qrcode = qrcode}
	   					src={videoInfo.qrcode}
	   				/>	
	   				:''
   				}
		        <footer>
	                <div className="icon shop-icon" onClick={() => this.openShop()}/>
	                <div className="icon comment-icon" onClick={() => this.openComment()}/>
	                <div className="icon packet-icon" onClick={() => this.openPacket()}/>
	                <div className={`icon praise-icon ${praised?'praised':''}`} onClick={() => this.openThumpsUp()}>
	                	{thumbsUpComponent}
	                </div>
	            </footer>
			</div>
		);
	}
}

module.exports = ShortVideoPage;
