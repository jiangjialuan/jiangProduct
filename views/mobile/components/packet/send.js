import React from 'react';
import {Link} from 'react-router';

import './send.scss';
// import socket from '../im';
import config from '../../config/common'; //公共配置文件
import ajax from '../../../common/js/ajax.js';
import auth from '../../js/auth'; //权限验证
import payment from '../../js/pay'; //支付模块 

let userInfo = auth.getUserInfo();
class Packet extends React.Component {
	constructor() {
		super();
		this.state = {
			show: false,
			errorTips: '',
			checkStatus: 'uncheck'
		}
		this.lastStatus = this.state.checkStatus;
	}

	renderTips(msg) {
		this.setState({
			errorTips: msg
		})
	}

	inputFocus() {
		this.renderTips("");
		this.interval = setInterval(() => {
	        document.body.scrollTop = document.body.scrollHeight;
	    }, 100);
	}

	validataPacketForm() {
		let tips = '',
			money = this.packetMoney.value;
		if (config.isArtqiyi) {
			let count = this.packetCount.value;
			if (!count) {
				return '个数不能为空';
			}
			if (count > 20) {
				return '个数最多为20个';
			}
		}
		if (!money) {
			return '金额不能为空';
		}
		return tips;
	}

	show() {
		this.packetMoney.value = '';
		try {
			this.packetCount.value = '';
		} catch (e) {}
		this.setState({
			errorTips: '',
			packetMoney: 0,
			show: true,
			checkStatus: 'uncheck'
		});
		this.lastStatus = 'uncheck';
	}

	hide() {
		this.setState({
			show: false
		});
		clearInterval(this.interval);
		this.interval = null;
	}

	checkInput(e) {
		let currentItem = e.target;
		if (/\D/g.test(currentItem.value)) {
			currentItem.value = currentItem.value.replace(/\D/g, '');
		}
		if (currentItem == this.packetMoney) {
			this.setState({
				packetMoney: parseFloat(currentItem.value || '0').toFixed(2)
			});

			let {checkStatus} = this.state;
			if(checkStatus == 'checked'){
				if (currentItem.value > auth.getUserInfo().balance) {
					this.setState({
						checkStatus: 'disable'
					});
				} else {
					this.setState({
						checkStatus: this.lastStatus
					});
				}
			}
		}
	}

	// 切换是否使用余额
	changeCheckStatus(e) {
		let currentItem = e.target,
			currentClassName = currentItem.classList,
			className;
		if (currentClassName.contains('disable')) return;
		if (currentClassName.contains('uncheck')) {
			className = 'checked';
		} else {
			className = 'uncheck';
		}
		this.setState({
			checkStatus: className
		});
		this.lastStatus = className;
	}

	sendPacket(e) {
		let currentItem = e.target,
			currentClassName = currentItem.classList,
			{onSuccess} = this.props;
		if (currentClassName.contains('disable')) return;
		let money = this.packetMoney.value,
			tips = this.validataPacketForm();
		if (config.isArtqiyi) {
			let count = this.packetCount.value;
			this.renderTips(tips);
			if (tips) return;
			currentClassName.add('disable');
			ajax.post(`${config.baseUrl}/api/v1/send_redenvelope`, {
				act: 1,
				tokenkey: config.utils.queryString('tokenkey'),
				amount: money,
				number: count
			}).done(data => {
				this.hide();
				userInfo = auth.getUserInfo();
				userInfo.balance = userInfo.balance - parseInt(money);
				auth.setUserInfo(userInfo);
			}).fail(json => {
				this.renderTips(json.state.msg);
			}).always(json => {
				currentClassName.remove('disable');
			});
		} else {
			let {vid} = this.props,
				params = {
					act: 11,
					money: money
				};
			if(vid){
				params.svid = vid;
			}	

			this.renderTips(tips);
			if (tips) return;
			currentClassName.add('disable');
			if (this.state.checkStatus == 'checked') { //如果是余额支付
				ajax.post(`${config.baseUrl}/api/v1/reward_redenvelope`, params)
				.done(data => {
					this.hide();
					userInfo = auth.getUserInfo();
					userInfo.balance = userInfo.balance - parseInt(money);
					auth.setUserInfo(userInfo);
					onSuccess　&& onSuccess(1,JSON.stringify(data));
				}).fail(json => {
					this.renderTips(json.state.msg);
				}).always(json => {
					currentClassName.remove('disable');
				});
			} else {
				let {vid} = this.props,
					params = {
						act: 11,
						pay_way: config.isWechat ? 2 : 1,
						money: money
					};
				if(vid){
					params.svid = vid;
					params.type = 1;
				}
				ajax.post(`${config.baseUrl}/api/v1/pay_order`, params).done(data => {
					this.hide();
					if (config.isWechat) {
						payment.wechatpay(data,onSuccess);
					} else {
						payment.alipay(data);
					}
				}).fail(json => {
					this.renderTips(json.state.msg);
				}).always(json => {
					currentClassName.remove('disable');
				});
			}
		}
	}

	render() {
		let {show,checkStatus} = this.state;
		if (config.isArtqiyi) { //主播发红包
			return (
				<div className={`popwin packet ${show?'show':''}`}>
					<div className="layer" onClick={()=>{this.hide()}}></div>
					<div className="content" onClick={e=>{e.nativeEvent.stopImmediatePropagation()}}>
			 			<div className="packet-title">发红包</div>
			 			<div className="packet-input">
			 				<span>红包个数</span>
			 				<input type="number" pattern="[0-9]*" placeholder="请填写个数，最少1个，最多20个" ref={packetCount => this.packetCount = packetCount} onKeyUp={this.checkInput.bind(this)} onFocus={this.inputFocus.bind(this)}/>
			 			</div>
			 			<div className="packet-input">
			 				<span>总金额</span>
			 				<input type="number" placeholder="请填写金额，最少1元" ref={packetMoney => this.packetMoney = packetMoney} onKeyUp={this.checkInput.bind(this)} onFocus={this.inputFocus.bind(this)}/>
			 			</div>
			 			<p className="error-tips">{this.state.errorTips}</p>
			 			<p className="packet-tips">每个红包金额随机，直播结束未抢完的红包自动退回账户</p>
			 			<div className="total-money">
			 				<p className="money">￥{this.state.packetMoney||'0.00'}</p>
			 				<p class="packet-tips">当前余额为{parseFloat(auth.getUserInfo().balance).toFixed(2)||0.00}元</p>
			 			</div>
			 			<button className="packet-btn" onClick={this.sendPacket.bind(this)} ref={packetBtn => this.packetBtn = packetBtn}>塞钱进红包</button>
					</div>
		 		</div>
			);
		}

		return (
			<div className={`popwin packet ${show?'show':''}`}>
				<div className="layer" onClick={()=>{this.hide()}}></div>
				<div className="content" onClick={e=>{e.nativeEvent.stopImmediatePropagation()}}>
		 			<div className="packet-title">发红包给主播</div>
		 			<div className="packet-input">
		 				<span>金额</span>
		 				<input type="number" pattern="[0-9]*" placeholder="请填写金额，最少1元" ref={packetMoney => this.packetMoney = packetMoney} onKeyUp={this.checkInput.bind(this)} onFocus={this.inputFocus.bind(this)}/>
		 			</div>
		 			<p className="error-tips">{this.state.errorTips}</p>
		 			<div className="total-money">
		 				<p className="money">￥{this.state.packetMoney||'0.00'}</p>
		 				<p className={`packet-tips ${checkStatus}`} onClick={this.changeCheckStatus.bind(this)}>使用余额（当前余额为{parseFloat(auth.getUserInfo().balance).toFixed(2)||0.00}元）</p>
		 			</div>
		 			<button className="packet-btn" onClick={this.sendPacket.bind(this)} ref={packetBtn => this.packetBtn = packetBtn}>塞钱进红包</button>
	 			</div>
	 		</div>
		);
	}
}

module.exports = Packet;