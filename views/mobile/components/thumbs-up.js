import React from 'react';
// import socket from './im';
import './thumbs-up.scss';
import '../iconfont/iconfont.css'; //iconfont文件
import config from '../config/common'; //公共配置文件
import ajax from '../../common/js/ajax.js';

let colors = ['#ff9393', '#86ccf8', '#85d487', '#ffbe8a', '#7fdce6',
		'#8f96eb', '#fce38a', '#f9585e', '#aa96da', '#ebc4fd'
	],
	maxCount = 12;

class ThunmbsUp extends React.Component {
	constructor() {
		super();
		this.state = {
			list: [],
			number: ''
		}
	}

	componentWillUnmount() {
		window.cancelAFrame(this.thumbsRequestFrame);
	}

	addItemToList(number){
		this.setState({
			number: config.utils.dealWithCount({
				number: number,
				basic: 10000,
				unit: '万',
				toFixed: 1
			})
		});
		let item = {
			color: colors[Math.floor(Math.random() * 10)],
			bottom: 0,
			fontSize: 0,
			opacity: .1,
			maxFontSize: parseFloat((Math.random() * (48 - 36 + 1) + 36) / 100).toFixed(2),
			right: [0, .12, .24, .36, .48, .60][parseInt(Math.random() * 6)],
			step: [0.02, 0.03, 0.06][parseInt(Math.random() * 3)],
			className: ['icon-shou', 'icon-liwu', 'icon-xing', 'icon-xin'][parseInt(Math.random() * 4)],
			renderd: 0
		};
		let thumbsUpList = this.state.list;
		thumbsUpList.push(item);
		this.setState({
			list: thumbsUpList
		});
	}

	// 点赞信息定时清理
	componentDidMount() {
		let {number} = this.props;
		this.setState({
			number: number
		});
		this.renderItem();
	}

	thunmbsUp(callback){
		let {vid} = this.props;
		ajax.post(`${config.baseUrl}/api/v1/thumbs_up`, {
			act: 11,
			svid: vid
		}).done(() => {
			let {number} = this.state;
			this.addItemToList(++number);
			callback && callback();
		}).fail(json => {
			alert(json.state.msg);
		});
	}

	renderItem() {
		let thumbsUpList = this.state.list;
		thumbsUpList.map((item, index) => {
			item.bottom += item.step;
			item.fontSize += item.step;
			if (item.fontSize > item.maxFontSize) {
				item.fontSize = item.maxFontSize;
			}
			if (item.opacity > .75) {
				item.opacity = .75;
			}
			if (item.bottom >= 5) {
				item.opacity -= item.step;
			} else {
				item.opacity += item.step;
			}
			if (item.bottom >= 6.4) {
				item.opacity = 0;
				thumbsUpList.splice(index, 1);
			}
		});

		if (thumbsUpList.length > maxCount) {
			thumbsUpList = thumbsUpList.slice(thumbsUpList.length - maxCount);
		}

		this.setState({
			list: thumbsUpList
		});

		this.thumbsRequestFrame = window.requestAFrame(() => {
			this.renderItem();
		});
	}

	addItem(callback) {
		let {praised,emitMsg} = this.props;
		if(typeof praised !='undefined' && !praised){

			this.thunmbsUp(callback);
		}else{
			emitMsg && emitMsg('thumbsUp');
		}
	}

	render() {
		let {list,number} = this.state;
		return (
			<div className="praise-area">
				<div className="praise-number">{number?number:''}</div>
       			{list.map((item,index) => {
       				let className = `iconfont praise-item ${item.className}`;
	              	return (
	              		<i key={index} className={className} style={{'-webkit-transform':'translateY(-'+item.bottom+'rem)',right:item.right+'rem',color:item.color,fontSize:item.fontSize+'rem',opacity:item.opacity}}></i>
	              	);
	           })}
       		</div>
		);
	}
}

export default ThunmbsUp;