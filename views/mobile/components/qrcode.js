import React from 'react';
import {
	Link
} from 'react-router';

import './qrcode.scss';

class Qrcode extends React.Component {
	constructor() {
		super();
		this.state={
			show:false
		}
	}

	hide() {
		this.setState({
			show: false
		});
	}

	show(){
		this.setState({
			show:true
		});
	}

	render() {
		let {show} = this.state,
			{src} = this.props;
		return (
			<div className={`popwin qrcode ${show?'show':''}`}>
	        	<div className="layer" onClick={()=>{this.hide()}}></div>
	        	<div className="content" onClick={e=>{e.nativeEvent.stopImmediatePropagation()}}>
	        		<img src={src} className='code'/>
	        	</div>
	        </div>
		);
	}
}

module.exports = Qrcode;
