import React from 'react';
import {Link} from 'react-router';

import './login.scss';
import config from '../config/common'; //公共配置文件
import ajax from '../../common/js/ajax.js';
import auth from '../js/auth'; //权限验证

let verifyCodeInterval, verifyCodeCount = 60,
	loginCallback;
class Login extends React.Component {
	constructor() {
		super();
		this.state = {
			errorTips: '',
			codeEnable: false,
			show: false
		}
	}

	componentWillUnmount() {
		this.clearCodeInterval();
	}

	hide() {
		this.setState({
			show: false
		});
	}

	renderTips(msg) {
		this.setState({
			errorTips: msg
		});
	}

	inputFocus() {
		this.renderTips("");
	}

	// 渲染验证码倒计时
	renderVerifyCodeText(flag, text) {
		this.setState({
			codeEnable: flag,
			codeText: text
		});
	}

	// 输入验证
	checkInput(e) {
		let currentItem = e.target;
		if (currentItem == this.mobilePhone) { // 手机号码输入验证
			this.setState({
				codeEnable: false
			});
			if (/^1[34578]\d{9}$/.test(currentItem.value)) {
				this.setState({
					codeEnable: true
				});
			}
		}
	}

	// 发送验证码
	sendVerifyCode() {
		if (this.verifyCodeBtn.className == 'code disable') return;
		this.setState({
			codeEnable: false
		});
		let mobilePhone = this.mobilePhone.value;
		ajax.get(`${config.baseUrl}/api/v1/send_verification`, {
			act: 3,
			mobile_phone: mobilePhone
		}).done(data => {
			let codeText = <span><i>{verifyCodeCount}</i>s后重试</span>,
				codeEnable = false;
			this.renderVerifyCodeText(codeEnable, codeText);
			verifyCodeInterval = setInterval(() => {
				verifyCodeCount--;
				if (verifyCodeCount == 0) {
					clearInterval(verifyCodeInterval);
					verifyCodeInterval = null;
					verifyCodeCount = 60;
					codeEnable = true;
					codeText = '';
				} else {
					codeText = <span><i>{verifyCodeCount}</i>s后重试</span>
				}
				this.renderVerifyCodeText(codeEnable, codeText);
			}, 1000);
		}).fail(msg => {
			this.renderTips(msg);
		});
	}

	// 表单验证
	validateForm() {
		let mobilePhone = this.mobilePhone.value,
			verifyCode = this.verifyCode.value,
			tips = '';
		if (!mobilePhone) {
			tips = '手机号码不能为空';
			return tips;
		}
		if (!/^1[34578]\d{9}$/.test(mobilePhone)) {
			tips = '手机号码格式不正确';
			return tips;
		}
		if (!verifyCode) {
			tips = '验证码不能为空';
			return tips;
		}
		if (!/\d/.test(verifyCode)) {
			tips = '验证码格式不正确';
			return tips;
		}

		return tips;
	}

	// 登陆
	login() {
		let mobilePhone = this.mobilePhone.value,
			verifyCode = this.verifyCode.value,
			tips = this.validateForm();
		this.renderTips(tips);
		if (tips) return;
		auth.login(mobilePhone, encodeURIComponent(verifyCode), {
			onSuccess: (data) => {
				auth.setUserInfo({
					userid: data.uid,
					username: data.name,
					isLogin: true,
					balance: data.balance
				});
				this.hide();
				
				loginCallback && loginCallback();
			},
			onFail: (data) => {
				this.renderTips(data.state.msg);
			}
		});
	}

	clearCodeInterval() {
		clearInterval(verifyCodeInterval);
		verifyCodeInterval = null;
		verifyCodeCount = 60;
	}

	show(callback) {
		this.mobilePhone.value = "";
		this.verifyCode.value = "";
		this.clearCodeInterval();
		this.renderVerifyCodeText(false, '');
		this.setState({
			show: true,
			errorTips: ''
		});
		loginCallback = callback;
	}

	hide() {
		this.setState({
			show: false
		});
	}

	render() {
		let {show} = this.state;
		return (
			<div className={`popwin login-area ${show?'show':''}`}>
				<div className="layer" onClick={() => this.hide()}></div>
				<div className="content" onClick={e=>{e.nativeEvent.stopImmediatePropagation()}}>
	       			<div className="login-title">欢迎，{auth.getUserInfo().username}</div>
	       			<div className="login-content">
	           			<p className="login-tips">您当前使用的是临时账户，登录抢红包、赚现金</p>
	           			<div className="clearfix">
	           				<div className="input-txt">
	           					<input type="tel" placeholder="请输入手机号" ref={mobilePhone => this.mobilePhone = mobilePhone} onInput={this.checkInput.bind(this)} onFocus={this.inputFocus.bind(this)}/>
	           				</div>
							<div className="input-txt">
	           					<input type="tel" placeholder="请输入验证码" ref={verifyCode => this.verifyCode = verifyCode} onFocus={this.inputFocus.bind(this)}/>
	           					<a className={this.state.codeEnable?'code':'code disable'} onClick={this.sendVerifyCode.bind(this)} ref={verifyCodeBtn => this.verifyCodeBtn = verifyCodeBtn}>
	           						{this.state.codeText||'验证码'}
								</a>
	           				</div>
	           			</div>
	           			<p className="error-tips">{this.state.errorTips}</p>
	           			<button className="login-btn" onClick={this.login.bind(this)}>登录</button>
	       			</div>
	       		</div>	
       		</div>
		);
	}
}

module.exports = Login;