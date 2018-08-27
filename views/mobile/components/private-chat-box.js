import {Component} from 'react';
import {Link} from 'react-router';

import './private-chat-box.scss';
import auth from '../js/auth'; //权限验证
import config from '../config/common'; //公共配置文件

const TYPING_TIMER_LENGTH = 800; //输入间隔
let typing = false,
	lastTypingTime,
	toUserid, toUsername;

class PrivateChatBox extends Component {
	constructor() {
		super();
		this.state = {
			msgList: [], //私聊
			show: false,
			loading:true
		};
	}

	componentWillUpdate() {
		let privateChat = this.privateChatList;
		this.privateChatScrollBottom = privateChat.scrollTop + privateChat.offsetHeight >= privateChat.scrollHeight;
	}

	componentDidUpdate() {
		if (this.privateChatScrollBottom) {
			let privateChat = this.privateChatList;
			privateChat.scrollTop = privateChat.scrollHeight;
		}
	}

	renderMsgList(item) {
		let {msgList} = this.state;
		msgList.push(item);
		this.setState({
			msgList: msgList
		});
	}

	onMsg(type,data,cb){
		switch (type){
			case 'init_msg':
				this.setState({
					msgList: data.msg || [],
					loading:false
				});
			break;
			case 'stoptyping':
				this.setState({
					chatTitle: <div className="chat-title">{config.isArtqiyi?<a className='back-link' onClick={() => this.showChatList()}></a>:''}与<span>{toUsername}</span>私信中</div>
				});
			break;
			case 'typing':
				if (data.uid == toUserid) {
					this.setState({
						chatTitle: <div className="chat-title">{config.isArtqiyi?<a className='back-link' onClick={() => this.showChatList()}></a>:''}对方正在输入...</div>
					});
				}
			break;
			case 'chat':
				let status = 'ok',
					{show} = this.state,					
					{newMsg} = this.props;
				console.log('chat',data);	
				if (show) {
					this.renderMsgList(data);
					// 需要区分从
					// if (data.toUid !== data.uid) { //发给对方
					// 	if (data.uid == toUserid) {
					// 		this.renderMsgList(data);
							status = 'read';
					// 	} else {
					// 		newMsg && newMsg(1);
					// 	}
					// } else {
					// 	this.renderMsgList(data);
					// }
				} else {
					newMsg && newMsg(1);
				}
				if (cb) cb(status);
			break;
		}
	}

	messageTyping() {
		let {emitMsg} = this.props;
		if (!typing) {
			typing = true;
			emitMsg && emitMsg('typing',{chatTo:toUserid});
		}
		lastTypingTime = (new Date()).getTime();
		setTimeout(() => {
			let typingTimer = (new Date()).getTime();
			let timeDiff = typingTimer - lastTypingTime;
			if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
				emitMsg && emitMsg('stoptyping',{chatTo:toUserid});
				typing = false;
			}
		}, TYPING_TIMER_LENGTH);
	}

	sendMessage(e) {
		let {emitMsg} = this.props;
		e.preventDefault();
		e.nativeEvent.stopImmediatePropagation();
		let message = this.chatInput.value;
		if (message) {
			let data = {
				username: auth.getUserInfo().username,
				message: message,
				roomId: 0,
				chatTo: toUserid
			};
			emitMsg && emitMsg('chat',data,{
				"success": data => {
					emitMsg && emitMsg('stoptyping',{chatTo:toUserid});
				},
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

	show(uid, uname) {
		let {emitMsg} = this.props;
		toUserid = uid;
		toUsername = uname;
		emitMsg && emitMsg('init_msg',{chatTo:toUserid});
		this.setState({
			show: true,
			chatTitle: <div className="chat-title">{config.isArtqiyi?<a className='back-link' onClick={() => this.showChatList()}></a>:''}与<span>{toUsername}</span>私信中</div>
		});
		this.chatInput.focus();
		this.interval = setInterval(() => {
	        document.body.scrollTop = document.body.scrollHeight;
	    }, 100);
	}

	showChatList() {
		let {openChatList} = this.props;
		openChatList && openChatList();
		this.hide();
	}

	hide() {
		this.setState({
			show: false
		});
		clearInterval(this.interval);
		this.interval = null;
	}

	render() {
		let {show,msgList,chatTitle,loading} = this.state;
		return (
			<div className={`popwin private-chat ${show?'show':''}`}>
				<div className="layer" onClick={() => this.hide()}></div>
				<div className="content" onClick={e => e.nativeEvent.stopImmediatePropagation()}>
	       			{chatTitle}
					<div className="private-chat-messages" ref={privateChatList => this.privateChatList = privateChatList}>
						<div className="loading">{loading?'正在拉取聊天信息...':''}</div>
						{msgList.map((item,index) => {
							let className = 'chat-content clearfix';
							if (item.toUid === item.uid || auth.getUserInfo().userid === item.uid) {
								className = "chat-content clearfix item-self";
								item.username = "我";
							}
			              	return (
			              		<div className="private-chat-item" key={index}>
									<div className="chat-time"><span>{config.utils.dealWithDate(item.create_time)}</span></div>
									<div className={className}>
										<div className="chat-name">{item.username}</div>
										<div className="chat-message">{item.message}</div>
									</div>
					            </div>
			              	);
			           })}
					</div>
					<form className='send-message clearfix' onSubmit={(e) => this.sendMessage(e)}>
					    <input type="text" placeholder="说点什么吧..." ref={chatInput => this.chatInput = chatInput} maxLength="50" onInput={() => this.messageTyping()}/>
	            		<button className="send-btn fl" type='submit'>发送</button>
					</form>
				</div>
       		</div>
		);
	}
}

module.exports = PrivateChatBox;