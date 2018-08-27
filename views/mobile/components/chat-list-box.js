import {Component} from 'react';
import {Link} from 'react-router';
import config from '../config/common'; //公共配置文件

import './chat-list-box.scss';
class ChatListBox extends Component {
	constructor() {
		super();
		this.state = {
			msgList: [], //私聊列表
			show: false,
			loading:true
		};
	}

	onMsg(type,data,cb){
		switch (type){
			case 'chatlist':
				this.setState({
					msgList: data || [],
					loading:false
				});
			break;
			case 'chat':
				if (typeof data.toUid != 'undefined') {
					this.renderMsgList(data);
				}
			break;
		}
	}

	renderMsgList(data) {
		let {msgList} = this.state,
			currentIndex,
			currentItem = msgList.filter((item,index) => {//检测私信列表中是否有该用户的历史信息
				if(item.uid == data.uid){
					currentIndex = index;
				}
				return item.uid == data.uid;
			})[0];
		if(currentItem){
			msgList[currentIndex].message = data.message;
			msgList[currentIndex].create_time = data.create_time;
			msgList[currentIndex].unread_num += 1;
		}else{
			data.unread_num = 1;
			msgList.unshift(data);
		}
		this.setState({
			msgList: msgList
		});
	}

	show() {
		let {emitMsg} = this.props;
		emitMsg && emitMsg('chatlist');
		this.setState({
			show: true
		});
	}

	chat(uid, uname) {
		let {openChatBox} = this.props;
		this.setState({
			msgList: [], //私信列表
			show: false
		});
		openChatBox && openChatBox(uid, uname);
	}

	hide() {
		this.setState({
			show: false
		});
	}

	render() {
		let {show,msgList,loading} = this.state;
		return (
			<div className={`chat-list popwin ${show?'show':''}`}>
				<div className="layer" onClick={() => {this.hide()}}></div>
				<div className="content"  onClick={e => {e.nativeEvent.stopImmediatePropagation()}}>
	       			<div className="chat-title">私信</div>
					<div className="chat-list-box">
						<div className="loading">{loading?'正在拉取私信列表...':''}</div>
						{msgList.map((item,index) => {
			              	return (
			              		<div className="chat-list-item" key={index} onClick={() => this.chat(item.uid, item.username)}>
				              		<div className='chat-item clearfix'>
										<div className='item-info fl'>
											<p className="item-name">{item.username}</p>
											<p className="item-message">{item.message}</p>
										</div>
										<div className='fr'>
											<p className="item-date">{config.utils.dealWithDate(item.create_time)}</p>
											{item.unread_num > 0?<span className="item-unread">{item.unread_num}</span>:''}
										</div>
					                </div>
				                </div>
			              	);
			           })}
					</div>
				</div>
			</div>
		);
	}
}

module.exports = ChatListBox;