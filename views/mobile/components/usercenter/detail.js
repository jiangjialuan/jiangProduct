import {Component} from 'react';
import {Link} from 'react-router';

import './detail.scss';
import auth from '../../js/auth'; //权限验证
import ajax from '../../../common/js/ajax.js';
import config from '../../config/common'; //公共配置文件
import InfiniteScroll from 'react-infinite-scroller';

const inoutType = ['', '主播发红包', '主播收红包', '粉丝发红包', '粉丝抢红包', '充值', '提现'],
	redeemType = ['未到账', '已到账', '提现失败'];

class UserDetail extends Component {
	constructor() {
		super();
		this.state = {
			redeemInfo:{
				list:[],
				page:1,
				hasNext:true,
				totalCount:0
			},
			inoutInfo:{
				list:[],
				page:1,
				hasNext:true,
				totalCount:0
			},
			type:'inout',
			loading:false
		}
	}

	// 获取收支明细
	getInoutData() {
		let {inoutInfo,type,loading} = this.state;
		if (type != 'inout'||loading) return;
		this.setState({
			loading:true
		});
		ajax.get(`${config.baseUrl}/api/v1/fund_log`, {
				act: 11,
				page: inoutInfo.page
			}).done(data => {
				this.setState({
					inoutInfo:{
						list:inoutInfo.list.concat(data.list),
						hasNext: inoutInfo.page < data.total_page,
						page: inoutInfo.page + 1,
						totalCount: data.total_count
					}
				});
			})
			.always(res => {
				this.setState({
					loading:false
				});
			});
	}

	// 获取提现明细
	getRedeemData() {
		let {redeemInfo,type,loading} = this.state;
		if (type != 'redeem'||loading) return;
		this.setState({
			loading:true
		});
		ajax.get(`${config.baseUrl}/api/v1/withdraw_funds_log`, {
				act: 11,
				page: redeemInfo.page
			})
			.done(data => {
				this.setState({
					redeemInfo:{
						list:redeemInfo.list.concat(data.list),
						hasNext: redeemInfo.page < data.total_page,
						page: redeemInfo.page + 1,
						totalCount: data.total_count
					}
				});
			})
			.always(res => {
				this.setState({
					loading:false
				});
			});
	}

	showUserInfo() {
		let {onUpdate} = this.props;
		require.ensure([], (require) => {
			let UserCenter = require('./center.js');
			onUpdate(<UserCenter {...this.props}/>);
        }, 'center');
	}

	toggleTab(type) {
		this.setState({
			type: type
		});
	}

	render() {
		let {type,inoutInfo,redeemInfo,show,loading} = this.state,
			{onHide} = this.props;
		return (
			<div className="content user-detail page" onClick={e=>{e.nativeEvent.stopImmediatePropagation()}}>
       			<div className="title"><a className='back-link' onClick={this.showUserInfo.bind(this)}></a>明细<a className='close-btn' onClick={() => onHide()}></a></div>
       			<div className='detail-tab clearfix'>
       				<a className={type=='inout'?'tab-item item-active':'tab-item'} onClick={this.toggleTab.bind(this,'inout')}>收支明细</a>
       				<a className={type=='redeem'?'tab-item item-active':'tab-item'} onClick={this.toggleTab.bind(this,'redeem')}>提现记录</a>
       			</div>
       			<div className='page-content'>
       				<InfiniteScroll
					    loadMore={this.getInoutData.bind(this)}
					    hasMore={inoutInfo.hasNext}
					   	useWindow={false}
					    threshold={30}
					    className={`detail-content ${type=='inout'?'inout-content':''}`}
					>
					{inoutInfo.list.map((item,index) => {
					    return (
					        <div className="detail-item clearfix" key={index}>
				              	<div className="item-info fl">
				                	<div className="item-name">{inoutType[item.type]}</div>
				                	<p><span className="item-date">{item.create_time}</span></p>
				              	</div>
				              	<div className='item-viewer fr'>
				                	<p><span className='viewer-num'>{item.balance_change > 0?`+${parseFloat(item.balance_change).toFixed(2)}`:`${parseFloat(item.balance_change).toFixed(2)}`}</span></p>
				              	</div>
				            </div>
					      );
					   	})}
						{!loading && inoutInfo.list.length == 0 ? <div className="loading"> (⊙ˍ⊙) 哎哟，这里空空如也…</div>:''}
						<div className="loading">{loading?'正在加载中...':''}</div>
				 	</InfiniteScroll>
       				<InfiniteScroll
					    loadMore={this.getRedeemData.bind(this)}
					    hasMore={redeemInfo.hasNext}
					   	useWindow={false}
					    threshold={30}
					    className={`detail-content ${type=='redeem'?'redeem-content':''}`}
					>
					{redeemInfo.list.map((item,index) => {
					    return (
					        <div className="detail-item clearfix" key={index}>
				              	<div className="item-info fl">
				                	<div className="item-name">提现 <span className={item.status == 1?'success':''}>{redeemType[item.status]}</span></div>
				                	<p><span className="item-date">{item.create_time}</span></p>
				              	</div>
				              	<div className='item-viewer fr'>
				                	<p><span className='viewer-num'>{`${parseFloat(item.money).toFixed(2)}`}</span></p>
				              	</div>
				            </div>
					      );
					   	})}
					{!loading && redeemInfo.list.length == 0 ? <div className="loading"> (⊙ˍ⊙) 哎哟，这里空空如也…</div>:''}
					<div className="loading">{loading?'正在加载中...':''}</div>
				 	</InfiniteScroll>
       			</div>
       		</div>
		);
	}
}

module.exports = UserDetail;