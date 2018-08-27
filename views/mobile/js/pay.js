import auth from '../js/auth'; //权限验证
import config from '../config/common'; //公共配置文件
let payway = {
		alipay: {
			baseUrl: (/live\./ig.test(location.href) ? "http://yimi.artqiyi.com" : "http://yimidemo.artqiyi.com") + '/middleware/wapalipay/malipay.php',
			notifyUrl: `${config.baseUrl}/pay/alipay_pay_notify`
		},
		feeUrl: `${config.baseUrl}/api/v1/get_fee`,
		successUrl: encodeURIComponent(location.href),
		failUrl: encodeURIComponent(location.href)
	},
	Payment = {
		wechatpay: (data, callback) => {
			auth.wechatConfig(() => {
				wx.chooseWXPay({
					timestamp: data.timeStamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
					nonceStr: data.nonceStr, // 支付签名随机串，不长于 32 位
					package: data.package, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
					signType: data.signType, // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
					paySign: data.paySign, // 支付签名
					success: () => {
						callback && callback(2,data);
					},
					fail: (res) => {
						alert(JSON.stringify(res));
					}
				});
			});
		},
		alipay: (data) => {
			location.href = `${payway.alipay.baseUrl}?id=${data.order_id}&notify_url=${data.notify_url||payway.alipay.notifyUrl}&get_fee_url=${data.get_fee_url||payway.feeUrl}&success_url=${payway.successUrl}&fail_url=${payway.failUrl}`;
		}
	};


export default Payment;