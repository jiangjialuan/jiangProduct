class UserIndex extends React.Component {
	constructor() {
		super();
		this.state = {
			show: false,
			childComponent:''
		};
	}

	componentDidMount() {
		require.ensure([], (require) => {
			let UserCenter = require('./center.js');
			this.setState({
				childComponent:<UserCenter {...this.props} onHide={() => this.hide()} onUpdate={(comp) => this.update(comp)}/>
			})
        }, 'center');
	}

	show() {
		this.setState({
			show: true
		});
	}

	hide(){
		this.setState({
			show: false
		});
	}

	update(comp){
		this.setState({
			childComponent: comp
		});
	}

  	render() {
  		let {show,childComponent} = this.state;
	    return (
	    	<div className={`popwin ${show?'show':''}`}>
				<div className="layer" onClick={()=> this.hide()}></div>
				{childComponent}
			</div>
	    );
  	}
}

module.exports = UserIndex;
