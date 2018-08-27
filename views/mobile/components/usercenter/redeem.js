import {Component} from 'react';
import {Link} from 'react-router';

import './redeem.scss';
import auth from '../../js/auth'; //权限验证
import ajax from '../../../common/js/ajax.js';
import config from '../../config/common'; //公共配置文件

const minMoney = 1;
class UserRedeem extends Component {
	constructor() {
		super();
		this.state = {
			show: false,
			errorTips: '',
			dialogComponent:''
		}
	}

	show() {
		this.setState({
			show: true,
		});
		this.redeemMoney.value = '';
	}

	inputFocus() {
		this.renderTips("");
	}

	checkInput(e) {
		let currentItem = e.target,
			money = parseFloat(currentItem.value || '0').toFixed(2);
		if (currentItem == this.redeemMoney) {
			this.setState({
				redeemMoney: money
			});
		}
	}

	validataPacketForm() {
		let tips = '',
			money = this.redeemMoney.value;
		if (!money) {
			return '金额不能为空';
		}
		if (money < minMoney) {
			return `提现金额不能少于${minMoney}元`;
		}
		if (money > auth.getUserInfo().balance) {
			return '提现金额不能超过账户余额';
		}
		return tips;
	}

	redeemConfirm() {
		let money = this.redeemMoney.value,
			tips = this.validataPacketForm();
		this.renderTips(tips);
		if (tips) return;
		this.setState({
			show: false,
			confirmMoney: money
		});

		this.openDialog({
			type: 'confirm',
			title: '重要提示',
			content: `您正在提现￥${parseFloat(money).toFixed(2) || 0.00}至微信账号，请仔细核对信息`,
			confirmBtnTxt: '确认提现',
			onConfirm: (e) => {
				this.redeem(e);
			}
		});
	}

	openDialog(params){
		if(this.Dialog){
			this.Dialog.show(params);
		}else{
			require.ensure([], (require) => {
				let Dialog = require('./../common/dialog');
				this.setState({
					dialogComponent:	<Dialog 
										ref={dialog => this.Dialog = dialog}
									/>
				});
				this.Dialog.show(params);
	        }, 'dialog');
		}
	}

	// 提现 目前只有普通用户可以提现
	redeem(e) {
		let currentItem = e.target;
		if (/disable/.test(currentItem.className)) return;
		currentItem.className = 'btn-item btn-confirm disable';
		let money = this.redeemMoney.value;
		ajax.post(`${config.baseUrl}/api/v1/withdraw`, {
			act: 11,
			money: money,
			account_type: 2
		}).done(data => {
			this.openDialog({
				content: `提现成功`
			});
			currentItem.className = 'btn-item btn-confirm';
			let userInfo = auth.getUserInfo();
			userInfo.balance -= parseFloat(money).toFixed(2);
			auth.setUserInfo(userInfo);
		}).fail(json => {
			this.openDialog({
				content: json.state.msg
			});
			currentItem.className = 'btn-item btn-confirm';
		});
	}

	hide() {
		this.setState({
			show: false
		});
	}

	renderTips(msg) {
		this.setState({
			errorTips: msg
		})
	}

	showUserInfo() {
		let {onUpdate} = this.props;
		require.ensure([], (require) => {
			let UserCenter = require('./center.js');
			onUpdate(<UserCenter {...this.props}/>);
        }, 'index');
	}

	redeemAll() {
		let balance = auth.getUserInfo().balance
		if (balance > 0) {
			this.redeemMoney.value = parseFloat(balance).toFixed(2);
		}
	}

	render() {
		let {onHide} = this.props,
			{dialogComponent} = this.state;
		return (
			<div className="content user-redeem" onClick={e=>{e.nativeEvent.stopImmediatePropagation()}}>
       			<div className="title"><a className='back-link' onClick={this.showUserInfo.bind(this)}></a>提现<a className='close-btn' onClick={() => onHide()}></a></div>
       			<div className='redeem-account clearfix'>
       				<div className='account-title clearfix'>
       					<span className='fl'>到帐帐号</span>
	       					<div className='redeem-account-toggle fr'>
	       					<span className='redeem-account-item item-active'>微信账户</span>
	       				</div>
       				</div>	
       			</div>
       			<div className='redeem-amount clearfix'>
       				<div className='amount-title'>
       					<span>提现金额</span>
       				</div>	
       				<div className='amount-input'>
       					<em>￥</em>
       					<input className='input-txt' ref={redeemMoney => this.redeemMoney = redeemMoney} onKeyUp={this.checkInput.bind(this)} onFocus={this.inputFocus.bind(this)} type='number' pattern="[0-9]*"/>
       					<span>不少于{minMoney}元，每天限提一次</span>
       				</div>
       				<p className='amount-tips'>账户余额￥{parseFloat(auth.getUserInfo().balance).toFixed(2)||0.00}，<a className='redeem-all' onClick={this.redeemAll.bind(this)}>全部提现</a></p>
       			</div>
       			<p className="error-tips">{this.state.errorTips}</p>
       			<div className='btn-area'>
       				<button className='redeem-btn' onClick={this.redeemConfirm.bind(this)}>确认提现</button>
       				<p className='service-tips'>提现成功后，金额自动进入微信零钱。</p>
       			</div>
       			{dialogComponent}
			</div>
		);
	}
}

module.exports = UserRedeem;