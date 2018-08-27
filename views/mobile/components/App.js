import React from 'react';
import {
  Link
} from 'react-router';
import InfiniteScroll from 'react-infinite-scroller';
import ReactSwipe from 'react-swipe';
import ajax from '../../common/js/ajax.js';
import './App.scss';

class IndexPage extends React.Component {
  constructor() {
      super();
      var _self = this;
      _self.starId = 123;
      _self.state = {
        carouselIndex: 0,
        page: 1,
        hasNext: true,
        list: [],
        imgs: []
      };
      _self.url = 'http://106.75.129.183:1888';
      _self.loading = false;

    }
    // 获取直播列表
  getData() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    ajax.get(`${this.url}/api/v1/online_list`)
      .done(data => {
        this.setState({
          list: this.state.list.concat(data),
          imgs: ['http://yanxuan.nosdn.127.net/f68f4e1de77aaf5e6aca40f93fe7b2e8.jpg?imageView&quality=85&thumbnail=750x400', 'http://yanxuan.nosdn.127.net/69fe230dd731d0f11888f7c8bb0d8cf5.jpg?imageView&quality=85&thumbnail=750x400', 'http://yanxuan.nosdn.127.net/456177bf7b57eecfdd3094257e3c7e08.jpg?imageView&quality=85&thumbnail=750x400'],
          hasNext: this.state.page < data.totalPage,
          page: this.state.page + 1
        });
      })
      .always(res => {
        this.loading = false;
      });
  }

  render() {
    return (
      <figure className="index-page">
            <div className="carousel-container">
              <ReactSwipe className="carousel" 
                key={this.state.imgs.length}
                swipeOptions={{
                  auto: 3000,
                  callback: (i, item) => {
                    if(this.state.imgs.length == 2){
                      i = i%2;
                    }
                    this.setState({carouselIndex: i})
                  }
                }}>
                {$.map(this.state.imgs, (item, i) => {
                  return (
                    <div className="goods-img-wrap" key={i}>
                      <img className="goods-img" src={item} />
                    </div>
                  );
                })}
              </ReactSwipe>
              <div className="ctrl-panel clearfix">
                <div className="carousel-ctrl">
                  {$.map(this.state.imgs, (item, j) => {
                    let className = 'carousel-ctrl-btn';
                    if (j == this.state.carouselIndex) {
                      className += ' active';
                    }
                    return (<span className={className} key={j}></span>);
                  })}
                </div>
              </div>
            </div>  
            <div className="video-list clearfix">
              <div className="title">正在直播</div>
              <InfiniteScroll
                loadMore={this.getData.bind(this)}
                hasMore={this.state.hasNext}
                loader={<div className="loading"></div>}
                useWindow={true}
                threshold={30}
              >
                {this.state.list.map(item => {
                  return (
                    <Link className="video-item fl" to={`/play/${item.uid}`} key={item.uid}>
                              <div className="item-img-wrap">
                                  <img className="item-img" src="http://img.artqiyi.com/data/attachment/work_cat/2016-11-17/wn/2d/2D3BE70C-ACE5-C251-3D54-1549E40F0CEF_280x280.jpg"/>
                                  <span className="v-hack"></span>
                              </div>
                      <div className="item-name">{item.username}</div>
                      <div className="item-viewer"><span className="viewer-num">{item.attendance}</span>人正在观看</div>
                              <div className="enter-btn">立即进入</div>
                    </Link>
                  );
                })}
              </InfiniteScroll>
            </div>
          </figure>
    )
  }

}

class App extends React.Component {
  render() {
    return (
      <div className='main'>
            {this.props.children || <IndexPage/>}
      </div>
    );
  }
}

module.exports = App;