import React from 'react';
import {Link} from 'react-router';
import config from '../config/common'; //公共配置文件
import ajax from '../../common/js/ajax.js';
import auth from '../js/auth'; //权限验证
import payment from '../js/pay'; //支付模块 

import './chat-input.scss';
let maxLength = 100;
class ChatInput extends React.Component {
	constructor() {
		super();
		this.state = {
			show: false,
			content: '',
			checkStatus: 'uncheck'
		}
		this.lastStatus = this.state.checkStatus;
	}

	renderTips(msg) {
		this.setState({
			errorTips: msg
		})
	}

    handleContentChange(e) {
    	let content = e.target.value.replace(/\r\n/,'');
        this.setState({
            content: content
        });
    }

	show() {
		this.setState({
			show: true,
			content:''
		});
		this.chatInput.focus();
		this.interval = setInterval(() => {
	        document.body.scrollTop = document.body.scrollHeight;
	    }, 100);
	}

	hide() {
		this.setState({
			show: false,
		});
		clearInterval(this.interval);
		this.interval = null;
		this.chatInput.blur();
	}

	sendMessage(e) {
		e.preventDefault();
		let message = this.chatInput.value,
			{roomid,emitMsg} = this.props;
		if (message) {
			let data = {
				username: auth.getUserInfo().username,
				message: message,
				roomId: roomid,
				chatTo: 0
			};
			emitMsg && emitMsg('chat',data,{
				"success": data => {},
				"timeout_time": 8000,
				"timeout_cb": () => {
					console.log("发送超时");
				},
				"error": () => {
					console.log("发送失败");
				}
			});
			this.chatInput.value = "";
			this.chatInput.focus();
		} else {
			this.chatInput.focus();
		}
	}

	render() {
		let {show,content} = this.state;
		return (
			<div className={`popwin send-pubilc-message ${show?'show':''}`}>
				<div className="layer" onClick={() => this.hide()}></div>
				<div className="content" onClick={e => {e.nativeEvent.stopImmediatePropagation()}}>
					<form onSubmit={(e) => this.sendMessage(e)}>
					    <input 
							placeholder="说点什么吧..." 
							ref={chatInput => this.chatInput = chatInput} 
							maxLength="50"/>
					    <button className="send-btn" type="submit">发送</button>
			    	</form>
				</div>
   			</div>
		);
	}
}

module.exports = ChatInput;