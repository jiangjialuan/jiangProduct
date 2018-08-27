import React from 'react';
import {
	Link
} from 'react-router';

import './play.scss';
import ajax from '../../common/js/ajax.js';
import config from '../config/common'; //公共配置文件
import auth from '../js/auth'; //权限验证
import VideoPlayer from './video-player.js'; //视频播放组件

class VideoPage extends React.Component {
	constructor() {
		super();
		this.state = {
			starInfo: {},
			videoInfo: {}
		}
	}

	getStarInfo(rid) {
		return ajax.get(`${config.baseUrl}/api/v1/zbinfo?roomId=${rid}`);
	}

	getVideoInfo(vid) {
		return ajax.get(`${config.baseUrl}/api/v1/video_info?vid=${vid}`);
	}

	componentDidMount() {
		let {uid,vid} = this.props.params;

		this.getStarInfo(uid)
			.done(data => {
				this.setState({
					starInfo: data
				});
				config.utils.setTitle(data.name + "的精彩回放");
			});

		this.getVideoInfo(vid)
			.done(data => {
				this.setState({
					videoInfo: data,
					videoPlayer:<VideoPlayer
							    	src={data.hls_url}
							    	duration={data.vlen} 
							    	objectFit
					 				showControl
							    />
				});
			});
	}

	render() {
		let {starInfo,videoInfo,videoPlayer} = this.state,
			{uid} = this.props.params;

		return (
			<div id="video-box" className='page'>
				<div className='bg'/>
				<div className='page-content'>
					<header>
		                <Link className="user-info fl" to={`/index/${uid}`} key={uid}>
		                	<span className="user-name">{starInfo.name}</span>
		                	<p>
		                		<span className="icon i-location fl">{starInfo.city}</span>
		                	</p> 
		                </Link>
	                	<div className="i-share fr hidden">
	                		赚￥12.00
	                	</div>
		            </header>
		            {videoPlayer}
			    </div>
			</div>
		);
	}
}

module.exports = VideoPage;