import React from 'react';
import config from '../config/common'; //公共配置文件
import ajax from '../../common/js/ajax.js';
import auth from '../js/auth'; //权限验证
import payment from '../js/pay'; //支付模块 

import './shop.scss';
let sdkConfig = {},
	goodsList = [],
	lastGoodsTime = new Date().getTime(),
	page = '/';
class Shop extends React.Component {
	constructor() {
		super();
		this.state = {
			goodsItem: ''
		}
	}

	clearRecommandGoodsInterval() {
		window.cancelAFrame(this.recommandGoodsRequestFrame);
	}

	onMsg(type,data,cb){
		switch (type){
			case 'recommendGoods':
				goodsList.push(data);
				if (goodsList.length == 1) {
					let tips = this.renderRecommandGoods(data);
					this.setState({
						goodsItem: tips
					});
				}
			break;
		}
	}

	componentDidMount() {
		this.getSDKInfo();
		this.initRecommandGoodsInterval();
	}

	componentWillUnmount() {
		ArtqiyiSDK.destory();
		this.clearRecommandGoodsInterval();
	}

	//初始化推荐商品	
	initRecommandGoodsInterval() {
		let offsetTime = new Date().getTime() - lastGoodsTime;
		if (offsetTime >= 6000) {
			let currentItem = goodsList[0],
				tips = '';
			if (currentItem) {
				tips = this.renderRecommandGoods(currentItem);
			}
			this.setState({
				goodsItem: tips
			});
			goodsList.splice(0, 1);
			lastGoodsTime = new Date().getTime();
		}
		this.recommandGoodsRequestFrame = window.requestAFrame(() => {
			this.initRecommandGoodsInterval();
		});
	}

	getSDKInfo(callback) {
		let userInfo = auth.getUserInfo(),
			{starid,title,svid} = this.props,
			host = /live\./ig.test(location.href) ? "yimi.artqiyi.com" : /livetest\./ig.test(location.href) ? "yimidemo.artqiyi.com" : '192.168.0.126:8080';
		sdkConfig.host = host;
		sdkConfig.title = title || '主播推荐';
		sdkConfig.svid = svid || '';
		sdkConfig.page = page;
		if (starid == userInfo.userid) {
			sdkConfig.title = title || '边看边买';
		}
		if (userInfo.isLogin) {
			ajax.get(`${config.baseUrl}/api/v1/get_sdk_zbinfo`, {
				uid: userInfo.userid
			}).done(data => {
				sdkConfig.anchorId = starid;
				sdkConfig.id = userInfo.userid;
				sdkConfig.sign = data.sign;
				sdkConfig.token = data.token;
				sdkConfig.ts = data.ts;
				this.initShop(callback);
			}).fail(json => {
				this.renderTips(json.state.msg);
			});
		} else {
			sdkConfig.anchorId = starid;
			sdkConfig.id = 0;
			this.initShop();
		}
	}

	// 初始化商城
	initShop(callback) {
		let {emitMsg} = this.props;
		ArtqiyiSDK.config(sdkConfig);
		ArtqiyiSDK.init();
		ArtqiyiSDK.onRecommend((data) => {
			emitMsg && emitMsg('recommendGoods', data)
		});
		ArtqiyiSDK.onPayment(data => {
			if (config.isWechat) {
				payment.wechatpay(data);
			} else {
				payment.alipay(data);
			}
		});
		ArtqiyiSDK.onLogin(data => {
			ArtqiyiSDK.destory();
			page = data.page;
			this.props.login(() => {
				this.reloadPage();
			});
		});
		callback && callback();
	}

	reloadPage() {
		this.getSDKInfo(() => {
			this.show();
		});
	}

	// 登录后的操作
	onLogin(){
		ArtqiyiSDK.destory();
		this.getSDKInfo();
	}

	show(url) {
		ArtqiyiSDK.show(url);
	}

	renderRecommandGoods(item) {
		return (
			<div className="goods-item" onClick={this.show.bind(this,`/detail/${item.id}`)}>
			    <div className="goods-img">
			        <img src={item.img} />
		        </div>
			    <div className="goods-name">{item.name}</div>
			    <div className="goods-price">¥{item.price}</div>
			    <div className="tirangle"></div>
			</div>
		);
	}

	render() {
		let {
			goodsItem
		} = this.state;
		return (
			<div className="recommand-goods">
				{goodsItem}
			</div>
		);
	}
}

module.exports = Shop;