import React from 'react';
import {Link} from 'react-router';
import auth from '../js/auth'; //权限验证
import config from '../config/common'; //公共配置文件

import './chat-box.scss';
let lastActiveTime = new Date().getTime(),
	maxMsgLength = 20;

class ChatBox extends React.Component {
	constructor() {
		super();
		this.state = {
			msgList: [{
				type: 'system-tips',
				message: '【系统消息】严禁色情、暴力等不良信息！'
			}], //公聊列表
			welcomeMsg: ''
		};
	}

	// 获取用户颜色值
	getUsernameColor(userid) {
		let {uid} = this.props;
		// f04e4c 主播颜色 #ffa200 自己的颜色 #333 其他人的颜色
		let color = '#333';
		if (userid == uid) {
			color = '#f04e4c';
		} else if (auth.getUserInfo().userid == userid) {
			color = '#ffa200';
		}
		return color;
	}

	componentWillUpdate() {
		let chatList = this.chatList;
		this.chatScrollBottom = chatList.scrollTop + chatList.offsetHeight >= chatList.scrollHeight;
	}

	componentDidUpdate() {
		if (this.chatScrollBottom) {
			let chatList = this.chatList;
			chatList.scrollTop = chatList.scrollHeight;
		}
	}

	componentWillUnmount() {
		this.clearMsgInterval();
	}

	// 欢迎语信息定时清理
	initMsgInterval() {
		let {msgList} = this.state;
		if (msgList.length >= maxMsgLength) {
			msgList = msgList.slice(msgList.length - maxMsgLength);
			this.setState({
				msgList: msgList
			});
		}

		this.msgRequestFrame = window.requestAFrame(() => {
			this.initMsgInterval();
		});
	}

	clearMsgInterval() {
		window.cancelAFrame(this.msgRequestFrame);
	}

	componentDidMount() {
		this.initMsgInterval();
	}

	// 接收socket信息
	onMsg(type,data,cb){
		switch (type){
			case 'chat':
				if (typeof data.toUid == 'undefined') { //公聊信息
					data.type = 'public_chat';
					this.renderMsgList(data);
					if (cb) cb('ok');
				}
			break;
			case 'init_group_msg':
				console.log('init_group_msg',data);
				data.msg.map((item, index) => {
					item.type = 'public_chat';
					this.renderMsgList(item);
				});
			break;	
			case 'gainRedEnvelope':
				data.type = 'envelope';
				this.renderMsgList(data);
			break;				
		}
	}

	chat(userid, uname) {
		let {uid,openChatBox} = this.props;
		if (!config.isArtqiyi) return;
		if (userid == uid) return;
		openChatBox && openChatBox(uid, uname);
	}

	// 渲染公聊信息列表
	renderMsgList(item) {
		let msgList = this.state.msgList;
		msgList.push(item);
		this.setState({
			msgList: msgList
		});
	}

	// 渲染公聊信息列表
	renderMsgItem(data) {
		let str;
		switch (data.type) {
			case 'public_chat':
				str = <span className="info" onClick={this.chat.bind(this,data.uid, data.username)}><span style={{color:this.getUsernameColor(data.uid)}}>{data.username}：</span>{data.message}</span>;
				break;
			case 'envelope':
				str = <span className="info" onClick={this.chat.bind(this,data.uid, data.username)}>恭喜 <span style={{color:this.getUsernameColor(data.uid)}}>{data.username} </span>抢到了 <span style={{color:'#f00'}}>{parseFloat(data.money).toFixed(2)}</span> 元的红包。</span>
				break;
			case 'system-tips':
				str = <span className="info system-tips">{data.message}</span>
				break;
		}
		return str;
	}

	render() {
		let {msgList} = this.state;
		return (
			<div className='room-chat' onClick={e=>{}}>
				<ul className="room-chat-messages" ref={list => this.chatList = list}>
		          	{msgList.map((item,index) => {
		              	return (
		              		<li className="room-chat-item" key={index}>{this.renderMsgItem(item)}</li>
		              	);
		           })}
				</ul>
			</div>
		);
	}
}

module.exports = ChatBox;