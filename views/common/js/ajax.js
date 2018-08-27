import $ from 'zepto';

function request(method, url, data) {
	let promise = $.Deferred();
	$.ajax({
		type: method,
		url,
		data,
		dataType: 'json',
		xhrFields: {
			withCredentials: true
		},
		crossDomain: true
	}).done(res => {
		if (res.state && res.state.code == 10200) {
			promise.resolve(res.data);
		} else {
			promise.reject(res);
		}
	}).fail(res => {
		promise.reject(res);
	});
	return promise;
}

function get(url, data) {
	return request('GET', url, data);
}

function post(url, data) {
	return request('POST', url, data);
}

let ajax = {
	get,
	post
};

export default ajax;