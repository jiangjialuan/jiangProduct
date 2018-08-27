import React from 'react';
import './dialog.scss';

class Dialog extends React.Component {
	constructor() {
		super();
		this.state = {
			show: false,
			type: ''
		};
	}

	hide() {
		this.setState({
			show: false
		});
	}

	show(params) {
		let type = params.type || 'alert',
			btnArea,
			content = <div className='pop-content'>
	       				<div className='pop-title'>{params.title || ''}</div>
	       				<p>
	       					{params.content || ''}
	       				</p>
	   				</div>;
		switch (type) {
			case 'alert':
				btnArea = <div className='pop-btn'>
		   						<a className='btn-item' onClick={() => this.hide()}>确认</a>
	   					  </div>;
				break;
			case 'confirm':
				btnArea = <div className='pop-btn'>
		   						<a className='btn-item' onClick={() => this.hide()}>取消</a>
		   						<a className='btn-item btn-confirm' onClick={params.onConfirm}>确认提现</a>
	   					  </div>;
				break;
			case 'custom':
				break;

		}
		this.setState({
			type: type,
			content: content,
			show: true,
			btnArea: btnArea
		});
	}

	render() {
		let {show,type,content,btnArea} = this.state;
		return (
			<div className={`popwin ${show?'show':''}`} >
				<div className="layer" onClick={() => this.hide()}></div>
				<div className={`dialog ${type} ${show?'show':''}`} onClick={e => {e.nativeEvent.stopImmediatePropagation()}}>
				    {content}
   					{btnArea}
				</div>
   			</div>
		);
	}
}

module.exports = Dialog;