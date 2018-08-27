import {render} from 'react-dom';
import {Router,Route,browserHistory} from 'react-router';
import useBasename from 'history/lib/useBasename';
import routes from './config/routes';
import '../common/css/common.scss';
const withBasename = (history, dirname) => {
	return useBasename(() => history)({
		basename: `/${dirname}/`
	});
};

render(
	(
		<Router history={withBasename(browserHistory, 'mobile')} routes={routes}></Router>
	),
	document.getElementById('app')
)