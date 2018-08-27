import {Component} from 'react';
import {Link} from 'react-router';
import auth from '../../js/auth'; //权限验证
import config from '../../config/common'; //公共配置文件

import './index.scss';
class UserCenter extends Component {
	constructor() {
		super();
	}
	
	redeem() {
		let {onUpdate} = this.props,
			UserRedeem;
		require.ensure([], (require) => {
			UserRedeem = require('./redeem.js');
			onUpdate(<UserRedeem {...this.props}/>);
        }, 'redeem');
	}

	detail() {
		let {onUpdate} = this.props,
			UserDetail;
		require.ensure([], (require) => {
			UserDetail = require('./detail.js');
			onUpdate(<UserDetail {...this.props}/>);
        }, 'detail');
	}

	order() {
		let {order} = this.props;
		order && order();
	}

	render() {
		let {isShowShop,onHide} = this.props,
			orderStr = '';
		if(isShowShop){
			orderStr = (
				<div className='user-order clearfix' onClick={() => this.order()}>
	   				<div className="order-title">
	   					我的订单
	   				</div>
	   			</div> 
			);
		}

		return (
			<div className="content user-center" onClick={e=>{e.nativeEvent.stopImmediatePropagation()}}>
				<div className="title">欢迎，{auth.getUserInfo().username}<a className='close-btn' onClick={() => onHide()}></a></div>
	   			<div className='user-praise'>
	   				<div className='praise-title clearfix'>
	   					<span className='fl'>我的奖励</span>
	   					<a className='fr detail-link' onClick={() => this.detail()}>明细</a>
	   				</div>
	   				<div className='praise-detail clearfix'>
	   					<span className='praise-money'>￥{parseFloat(auth.getUserInfo().balance).toFixed(2)||0.00}</span>
	   					<a className='fr resume-btn' onClick={() => this.redeem()}>提现</a>
	   				</div>
	   			</div>
				{orderStr}	
			</div>
		);
	}
}

module.exports = UserCenter;
