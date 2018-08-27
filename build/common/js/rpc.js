
function rpcClient(url) {

    var param = {"reconnection":false,"force new connection":true};

    this.url = url;
    this.socket = io.connect(this.url, param);
    this.connect_count = 0;
    this.connect_cb =  '';
    this.reconnect_cb = '';

    this.cid = 0;
    this.response_cb_map = {};
    this.static_cb_map = {};
    this.err_cb_map = {};
    this.BeatTimerId = -1;
    this.connect_status = "undefine";
    var that = this;
    var rpc_cli = this;

    this.copyAllListeners = function() {
        for (var key in that.static_cb_map) {
            var fn_list = that.static_cb_map[key];
            for(var cb_key in fn_list) {
                that.socket.on(key, fn_list[cb_key]);
            }
        }
    };

    this.reconnect = function() {
        if ("connected" == that.connect_status || "connecting" == that.connect_status) return;
        that.connect_status = "connecting";
        that.socket = io.connect(that.url, param);
        that.copyAllListeners();
    };

    this.clear_err_cb = function(reconnect_time) {
        that.response_cb_map = {} // rm all success cb
        for (var key in that.err_cb_map) {
            var err_cb = that.err_cb_map[key];
            err_cb(); // exe err cb
        }
        that.err_cb_map = {};
    };

    this.close_handler = function(reconnect_time) {
        that.socket.disconnect();
        that.clear_err_cb();
        that.socket.removeAllListeners();
        that.connect_status = "closed";
        reconnect_time = reconnect_time || 1000;
        setTimeout(function(){that.reconnect();},reconnect_time);

    };

    this.nextId = function() {
        var new_id = ++rpc_cli.cid;
        if (rpc_cli.cid > 999999999) {
            rpc_cli.cid = 0;
        }
        return new_id;
    };

    this.setBeatTime = function(beat_time, timeout) {
        if (that.BeatTimerId > 0) {
            clearInterval(that.BeatTimerId);
            that.BeatTimerId = -1;
        }
        if (beat_time <= 0) return;
        var timeout = timeout || 20000;
        that.BeatTimerId = setInterval(function(){
            if ("connected" == that.connect_status) {
                that.emit('rpc_beat',"",{
                    "success": function(){},
                    "timeout_time": timeout,
                    "timeout_cb": function(){
                      console.log("beat time out");
                      that.socket.disconnect(); 
                    },
                    "error":function(){
                      console.log("beat error");
                    }
                });
            }
        }, beat_time);
    };

    this.inner_on = function(route, cb) {
        var fn_list = that.static_cb_map[route] || new Array();
        fn_list.push(cb);
        that.static_cb_map[route] = fn_list;
        that.socket.on(route, function(data){
            cb(data);
        });
    }

    this.on = function(route, cb) {
        if ("connect" == route) {
            if (that.connect_status == "connected") cb();
            else that.connect_cb = cb;
            return;
        }
        if ("reconnect" == route) {
            that.reconnect_cb = cb;
            return;
        }
        that.inner_on(route, cb);
    };

    // rpc response
    this.on("rpc_response", function (data){
        if ("rpc_cid" in data && data.rpc_cid in that.response_cb_map) {
            var suc_cb = that.response_cb_map[data.rpc_cid];
            var suc_data = data.rpc_data || {};
            suc_cb(suc_data);
        }
    });

    // rpc request
    this.on("rpc_request", function (data){
        if ("rpc_route" in data && data.rpc_route in that.static_cb_map) {
            var fn_list = that.static_cb_map[data.rpc_route];
            for (var cb_key in fn_list) {
                var route_cb = fn_list[cb_key];
                var rpc_data = data.rpc_data || {};
                route_cb(rpc_data,function(response) {
                    var response_json = {};
                    response_json["rpc_cid"] = data.rpc_cid;
                    response_json["rpc_data"] = response;
                    that.socket.emit('rpc_response', response_json);
                });
            }
        }
    });

    // for beat
    this.on('rpc_beat', function (data, cb) {
        if (cb) cb("");
    });


    this.inner_on('connect',function(data){
        that.connect_status = "connected";
        that.connect_count += 1
        if (that.connect_count > 1) {
            if (typeof(that.reconnect_cb) == "function") that.reconnect_cb(data);
        } else {
            if (typeof(that.connect_cb) == "function") that.connect_cb(data);
        }
    });
    this.inner_on('reconnect',function(){
        that.connect_status = "connected";
    });
    this.on('disconnect', function(){that.close_handler(10);});
    this.on('connect_error', function(){that.close_handler(1000);});
    this.on('connect_timeout', function(){that.close_handler(1000);});

    //options:
    //  success: callback for success response
    //  error: callback for error
    //  if has success callback:
    //    timeout_time: time for timeout ms
    //    timeout_cb: callback for timeout
    this.emit = function(route, msg, options) {
        options = options || {};

        if (!options.success && !options.error) {// no callback
            if (msg) {
                that.socket.emit(route,msg);
            } else {
                that.socket.emit(route);
            }
        } else {
            var new_id =String(that.nextId());
            var timeout_id;
            if (options.success) {
                // timeout callback
                if (options.timeout_cb) {
                    var timeout = options.timeout_time || 10000;
                    timeout_id = setTimeout(function() {
                        if (new_id in that.err_cb_map) {delete that.err_cb_map[new_id];} // rm err cb
                        if (new_id in that.response_cb_map) {
                            delete that.response_cb_map[new_id]; // rm success cb
                            options.timeout_cb(); // exe timeout cb
                        }
                    }, timeout);
                }

                // success callback
                var suc_cb_cb = function(suc_data) {
                    if (new_id in that.response_cb_map) {delete that.response_cb_map[new_id];}
                    if (new_id in that.err_cb_map) {delete that.err_cb_map[new_id];} // rm err cb
                    if (timeout_id) {clearTimeout(timeout_id);} // rm timeout cb
                    options.success(suc_data); // exe success cb
                };
                that.response_cb_map[new_id] = suc_cb_cb;
            }

            // err callback
            if (options.error) {
                var e_cb_cb = function() {
                    if (new_id in that.response_cb_map) {delete that.response_cb_map[new_id];} // rm success cb
                    if (timeout_id) {clearTimeout(timeout_id);} // rm timeout cb
                    options.error(); // exe error cb
                }
                that.err_cb_map[new_id] = e_cb_cb;
            }

            if ("connected" != that.connect_status) {
                that.clear_err_cb();
                return;
            }

            var new_msg = {};
            new_msg["rpc_cid"] = new_id;
            new_msg["rpc_route"] = route;
            if (msg) {
                new_msg["rpc_data"] = msg;
                that.socket.emit("rpc_request",new_msg);
            } else {
                that.socket.emit("rpc_request",new_msg);
            }
        }
    };

}

// $.ping = function(option) 
// {
//     var ping, requestTime, responseTime ;
//     var getUrl = function(url){    //保证url带http://
//         var strReg="^((https|http)?://){1}"
//         var re=new RegExp(strReg); 
//         return re.test(url)?url:"http://"+url;
//     }
//     $.ajax({
//         url: getUrl(option.url)+'/'+ (new Date()).getTime() + '.html',  //设置一个空的ajax请求
//         type: 'GET',
//         dataType: 'html',
//         timeout: option.timeout || 10000,
//         beforeSend : function() 
//         {
//             if(option.beforePing) option.beforePing();
//             requestTime = new Date().getTime();
//         },
//         complete : function(XMLHttpRequest,status) 
//         {
//             if(status=='success'){
//                 responseTime = new Date().getTime();
//                 ping = Math.abs(requestTime - responseTime);
//                 if(option.afterPing) option.afterPing(ping);
//             } else {
//                 if(option.error) option.error();
//             }
//         }
//     });

//     if(option.interval && option.interval > 0)
//     {
//         var interval = option.interval;
//         //setTimeout(function(){$.ping(option)}, interval);
// //        option.interval = 0;        // 阻止多重循环
// //        setInterval(function(){$.ping(option)}, interval);
//     }
// };

