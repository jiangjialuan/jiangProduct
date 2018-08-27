import React from 'react';
import {
	Link
} from 'react-router';

import './comment.scss';
import config from '../config/common'; //公共配置文件
import ajax from '../../common/js/ajax.js';
import auth from '../js/auth'; //权限验证
import payment from '../js/pay'; //支付模块 

let maxLength = 100;
class Comment extends React.Component {
	constructor() {
		super();
		this.state = {
			show: false,
			content: ''
		}
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
		this.interval = setInterval(() => {
	        document.body.scrollTop = document.body.scrollHeight;
	    }, 100);
		this.chatInput.focus();
	}

	hide() {
		this.setState({
			show: false
		});
		this.chatInput.blur();
		clearInterval(this.interval);
		this.interval = null;
	}

	sendMessage(e) {
		e.preventDefault();
		if(this.disable) return;
		let {vid,onSuccess} = this.props,
			{content} = this.state;
		if(!content){
			this.chatInput.focus();
			return false;
		}
		this.disable = true;
		ajax.post(`${config.baseUrl}/api/v1/video_comment`, {
			act: 11,
			svid: vid,
			content: content
		}).done(data => {
	        this.disable = false;
			onSuccess　&& onSuccess(JSON.stringify(data));
			this.hide();
	        this.setState({
	            content: ''
	        });
		}).fail(msg => {
			this.disable = false;
			alert(JSON.stringify(msg));
		});
	}

	render() {
		let {show,content} = this.state;
		return (
			<div className={`popwin comment ${show?'show':''}`}>
				<div className="layer" onClick={() => this.hide()}></div>
				<div className="content" onClick={e => {e.nativeEvent.stopImmediatePropagation()}}>
				    <div className="title clearfix">
				    	<button onClick={() => this.hide()}>取消</button>
				    	<span>{content.length||0}/{maxLength}</span>
				    	<form onSubmit={e =>this.sendMessage(e)}>
				    		<button type="submit">发布</button>
				    	</form>
			    	</div>
				    <textarea 
				    	className="comment-content"
			    		placeholder='评论两句吧...'
			    		maxLength={maxLength}
			    		ref={input => this.chatInput = input}
			    		onChange={e => this.handleContentChange(e)}
			    		value={content}/>
				</div>
   			</div>
		);
	}
}

module.exports = Comment;