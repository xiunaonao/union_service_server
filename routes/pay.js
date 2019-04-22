var express = require('express');
var router = express.Router();
let request=require('request')
request=request.defaults({jar: true})
let union_wechat={appid:'wxb5ed549f53f1ba99',secret:'9e2e9837c28f3f849613c23cd1aa9a81'}
const axios = require('axios')
const md5 = require('blueimp-md5')
const xml2js = require('xml2js')
const xmlParser = new xml2js.Parser()
let mssql=require('../server/mssql')


const attach = 'cx_union'
const appId='wxb5ed549f53f1ba99'
const mchId='1532951301'
const PAY_API_KEY='Hzhm233Cxxzgh666Zxw999Txwx213213'
	const nonceStr=getNonceStr()
	const sign_type='MD5'
	const tradeId = getTradeId(attach)
	const ip='121.43.36.218'
	const notifyUrl='http://www.weixin.qq.com/wxpay/pay.php'
	const trade_type='JSAPI'
	const productIntro='长兴县总工会慈善分会'





/* GET home page. */
router.get('/create_order', function(req, res, next) {
	if(isNaN(req.query.price) || !req.query.openid){
		res.json({error:'openid or price null'})
		return
	}
	res.set({
		'Access-Control-Allow-Origin': '*'
	})
  //res.render('index', { title: 'Express' });
	let url='https://api.mch.weixin.qq.com/pay/unifiedorder'

	const price=req.query.price*100
	const openId=req.query.openid
	const sign = getPrePaySign(appId, attach, productIntro, mchId, nonceStr, notifyUrl, openId, tradeId, ip, price)
	const sendData = wxSendData(appId, attach, productIntro, mchId, nonceStr, notifyUrl, openId, tradeId, ip, price, sign)
	axios.post(url, sendData).then(wxResponse => {
       // 微信返回的数据也是 xml, 使用 xmlParser 将它转换成 js 的对象
        xmlParser.parseString(wxResponse.data, (err, success) => {
        	console.log(err)


            if (err) {
                log('parser xml error ', err)
                res.json(err)
            } else {
            	// res.json(success)
            	// return


    //         	mssql.insert('cxwx_order_info',{
				// 	openid:{
				// 		type:'',
				// 		value:openId
				// 	},
				// 	str:{
				// 		type:'',
				// 		value:success
				// 	}
				// },(err,result,count)=>{

				// })

            	//res.json(success)
                if (success.xml.return_code[0] === 'SUCCESS') {

                    const prepayId = success.xml.prepay_id[0]
                    const payParamsObj = getPayParams(prepayId, tradeId)
                    // 返回给前端, 这里是 express 的写法
                    res.json({success:1,data:payParamsObj})
                } else {
                	res.json({success:0.data:null})
                    // 错误处理
                    // if (err) {
                    //     //log('axios post error', err)
                    //     //res.sendStatus(502)
                    //     res.json
                    // } else if (success.xml.return_code[0] !== 'SUCCESS') {
                    //     res.sendStatus(403)
                    // }
                }
            }
        })
    }).catch(err => {
        //log('post wx err', err)
        console.log(err)
        res.json({err:err})
    })

})


router.get('/pay',(req,res,next)=>{

})


function getNonceStr() {
    var text = ""
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    for (var i = 0; i < 16; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}


function getPaySign(appId, timeStamp, nonceStr, package) {
    var stringA = 'appId=' + appId +
        '&nonceStr=' + nonceStr +
        '&package=' + package +
        '&signType=MD5' +
        '&timeStamp=' + timeStamp

    var stringSignTemp = stringA + '&key=' + PAY_API_KEY
    var sign = md5(stringSignTemp).toUpperCase()
    return sign
}


function getTradeId(attach) {
    var date = new Date().getTime().toString()
    var text = ""
    var possible = "0123456789"
    for (var i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    var tradeId = 'ty_' + attach + '_' + date + text
    return tradeId
}

function getPrePaySign(appId, attach, productIntro, mchId, nonceStr, notifyUrl, openId, tradeId, ip, price) {
    var stringA = 'appid=' + appId +
        '&attach=' + attach +
        '&body=' + productIntro +
        '&mch_id=' + mchId +
        '&nonce_str=' + nonceStr +
        '&notify_url=' + notifyUrl +
        '&openid=' + openId +
        '&out_trade_no=' + tradeId +
        '&spbill_create_ip=' + ip +
        '&total_fee=' + price +
        '&trade_type=JSAPI'
    var stringSignTemp = stringA + '&key=' + PAY_API_KEY
    var sign = md5(stringSignTemp).toUpperCase()
    return sign
}


function wxSendData(appId, attach, productIntro, mchId, nonceStr, notifyUrl, openId, tradeId, ip, price, sign) {
    const sendData = '<xml>' +
        '<appid>' + appId + '</appid>' +
        '<attach>' + attach + '</attach>' +
        '<body>' + productIntro + '</body>' +
        '<mch_id>' + mchId + '</mch_id>' +
        '<nonce_str>' + nonceStr + '</nonce_str>' +
        '<notify_url>' + notifyUrl + '</notify_url>' +
        '<openid>' + openId + '</openid>' +
        '<out_trade_no>' + tradeId + '</out_trade_no>' +
        '<spbill_create_ip>' + ip + '</spbill_create_ip>' +
        '<total_fee>' + price + '</total_fee>' +
        '<trade_type>JSAPI</trade_type>' +
        '<sign>' + sign + '</sign>' +
        '</xml>'
    return sendData
}


function getPayParams(prepayId, tradeId) {
    const nonceStr = getNonceStr()
    const timeStamp = new Date().getTime().toString()
    const package = 'prepay_id=' + prepayId
    const paySign = getPaySign(appId, timeStamp, nonceStr, package)
    // 前端需要的所有数据, 都从这里返回过去
    const payParamsObj = {
        nonceStr: nonceStr,
        timeStamp: timeStamp,
        package: package,
        paySign: paySign,
        signType: 'MD5',
        tradeId: tradeId,
    }
    return payParamsObj
}



function get(url,callback){
	request(url,(err,res,body)=>{
		console.log(body)
		if (!err && res.statusCode == 200) {
	        callback(JSON.parse(body))
	    }
	})
}



function post(url,req,callback,data_type){
	let config={
	    url: url,
	    method: "POST",
	    json: true,
	    headers: {
	        "content-type": data_type!='form'?'application/json':"application/x-www-form-urlencoded",
	    }
	}
	if(data_type!='form')
		config.body=req
	else
		config.form=req
	console.log(config)
	request(config, function(err, res, body) {
		console.log(err)
		console.log(res.statusCode)
		console.log(body)
	    if (!err && res.statusCode == 200) {
	        callback(body)
	    }
	});
}

module.exports = router;
