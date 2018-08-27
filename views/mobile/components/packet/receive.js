import React from 'react';
import {Link} from 'react-router';
import config from '../../config/common'; //公共配置文件
import ajax from '../../../common/js/ajax.js';
import auth from '../../js/auth'; //权限验证

import './receive.scss';
let sendPacketTipsArr = [],
	lastActiveTime = new Date().getTime();
class RobPacket extends React.Component {
	constructor() {
		super();
		this.state = {
			packetTips: '',
			sendPacketTips: ''
		}
	}

	componentWillUnmount() {
		this.clearSendPacketTipsInterval();
	}

	onMsg(type,data,cb){
		switch (type){
			case 'redEnvelope': //主播发红包
				if (config.isArtqiyi) {
					this.renderTips(5, data);
				} else {
					this.renderTips(1, data, 2 * 60);
				}
			break;
			case 'privateRedEnvelope': // 用户发送私包
				this.renderSendPacketTips(data, 3);
			break;
		}
	}

	componentDidMount() {
		this.initSendPacketTipsInterval();
	}

	//初始化送出红包提示	
	initSendPacketTipsInterval() {
		let offsetTime = new Date().getTime() - lastActiveTime;
		if (offsetTime >= 5000) {
			let currentItem = sendPacketTipsArr[0],
				tips = '';
			if (currentItem) {
				tips = <div className='rob-packet-tips'> {currentItem.username} 送出一个￥{parseFloat(currentItem.amount).toFixed(2)}的红包</div>;
			}
			this.setState({
				sendPacketTips: tips
			});
			sendPacketTipsArr.splice(0, 1);
			lastActiveTime = new Date().getTime();
		}

		this.sendPacketTipsRequestFrame = window.requestAFrame(() => {
			this.initSendPacketTipsInterval();
		});
	}

	clearSendPacketTipsInterval() {
		window.cancelAFrame(this.sendPacketTipsRequestFrame);
	}

	robPacket(id) {
		let userInfo = auth.getUserInfo(),
			{login} = this.props;
		id = id || 0;
		if (id) {
			if (!userInfo.isLogin) return this.props.login();
			ajax.post(`${config.baseUrl}/api/v1/grab_redenvelope`, {
				act: 11,
				redenvelope_id: id
			}).done(data => {
				if (data.money) {
					this.renderTips(2, data);
					userInfo.balance += data.money;
					auth.setUserInfo(userInfo);
				} else {
					this.renderTips(3, data);
				}
			}).fail(json => {
				this.renderTips(3, json);
			});
		}
	}

	hide() {
		this.setState({
			packetTips: ''
		});
	}

	// 渲染抢红包
	renderTips(type, data, time) {
		let tips = "";
		switch (type) {
			case 1:
				tips = <div className="rob-packet packet-receive" onClick={this.robPacket.bind(this,data.redenvelope_id)}>
	           			<div className="rob-packet-content">
		           			<div className="packet-title">
		           				<h3>{data.username}</h3>发了一个红包
		   				 	</div>
		           			<div className="total-money">
		           				<p className="money">￥{data.amount}</p>
		           			</div>
	           			</div>
           			</div>;
				break;
			case 2:
				tips = <div className="rob-packet packet-robed" onClick={this.robPacket.bind(this,0)}>
		           			<div className="rob-packet-content">
		           				<a className='close-btn' onClick={() => this.hide()}></a>
			           			<div className="packet-title">
			           				<h3>手气爆棚</h3>
			           				<button className='hidden'>喊人来抢</button>	
			   				 	</div>
			           			<div className="total-money">
			           				<p className="money">￥{data.money}</p>
			           				<p className="tips">已存入个人账户</p>
			           			</div>
		           			</div>
		           		</div>;
				break;
			case 3:
				tips = <div className="rob-packet packet-robed-out" onClick={this.robPacket.bind(this,0)}>
		           			<div className="rob-packet-content">
		           				<a className='close-btn' onClick={() => this.hide()}></a>
			           			<div className="packet-title">
			           				<h3>手慢了~</h3>
									红包被瓜分干净
									<button className='hidden'>喊人来抢</button>	
			   				 	</div>
		           			</div>
		           		</div>;
				break;
			case 5:
				tips = <div className="rob-packet packet-receive-star" onClick={this.robPacket.bind(this,0)}>
		          			<div className="rob-packet-content">
			          			<a className='close-btn' onClick={() => this.hide()}></a>
			           			<div className="packet-title">
			           				红包已派发
			   				 	</div>
		  				 	</div>
		          		</div>;
				break;
		}
		this.setState({
			packetTips: tips
		});
	}

	renderSendPacketTips(data, time) {
		sendPacketTipsArr.push({
			username: data.username,
			amount: data.amount
		});
		if (sendPacketTipsArr.length == 1) {
			let tips = <div className='rob-packet-tips'>{data.username} 送出一个￥{parseFloat(data.amount).toFixed(2)}的红包</div>
			this.setState({
				sendPacketTips: tips
			});
		}
	}

	render() {
		let {packetTips,sendPacketTips} = this.state;
		return (
			<div className="clearfix" onClick={e=>{e.nativeEvent.stopImmediatePropagation()}}>
	 			{packetTips}
	 			{sendPacketTips}
	 		</div>
		);
	}
}

module.exports = RobPacket;