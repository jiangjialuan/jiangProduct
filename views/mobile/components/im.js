// import socket from 'socket-io';
window.rpc;
let rpcAddr = /live\./ig.test(location.href) ? "http://106.75.148.152:3000" : "http://106.75.129.183:3000";
if (!window.rpc) {
	window.rpc = new rpcClient(rpcAddr);
}
window.rpc.setBeatTime(5000);
let socket = {
	isConnected: 0,
	emitMsg: (type, data, callback) => {
		window.rpc.emit(type, data, callback);
	},
	onMsg: (type, callback, cb) => {
		window.rpc.on(type, (data, cb) => {
			switch (type) {
				case 'connect':
					console.log("socket连接成功");
					break;
				case 'reconnect':
					console.log("socket重连接成功");
					break;
				case 'disconnect':
					console.log("socket断开");
					break;
				case 'connect_error':
					console.log("socket连接失败");
					break;
				case 'connect_timeout':
					console.log("socket连接超时");
					break;
			}
			callback && callback(data, cb);
		});
	},
	connectSocket: (uid, uname, roomid) => {
		if (uid) {
			socket.emitMsg('login', {
				"username": uname,
				"roomId": roomid,
				"chatFrom": uid
			});
		}
	}
}

export default socket;