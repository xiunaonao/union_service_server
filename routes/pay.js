var express = require('express');
var router = express.Router();
let request=require('request')
const cx_wechat=require('../dataWechat.json')
request=request.defaults({jar: true})
let union_wechat=cx_wechat.cx.wechat
const axios = require('axios')
const md5 = require('blueimp-md5')
const xml2js = require('xml2js')
const xmlParser = new xml2js.Parser()
let mssql=require('../server/mssql')


const {attach,appId,mchId,PAY_API_KEY,sign_type,ip,notifyUrl,trade_type,productIntro} = cx_wechat.cx;




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

	const nonceStr=getNonceStr()
	const tradeId = getTradeId(attach)
	const price=req.query.price
	const openId=req.query.openid
	const sign = getPrePaySign(appId, attach, productIntro, mchId, nonceStr, notifyUrl, openId, tradeId, ip, price)
	const sendData = wxSendData(appId, attach, productIntro, mchId, nonceStr, notifyUrl, openId, tradeId, ip, price, sign)
	axios.post(url, sendData).then(wxResponse => {
       // 微信返回的数据也是 xml, 使用 xmlParser 将它转换成 js 的对象
        xmlParser.parseString(wxResponse.data, (err, success) => {
        	console.log(err)
        	console.log(success)

            if (err) {
                log('parser xml error ', err)
                res.json(err)
            } else {
            	// res.json(success)
            	// return

            try{
            	mssql.insert('cxwx_order_info',{
					openid:{
						type:'',
						value:openId
					},
					str:{
						type:'',
						value:success
					}
				},(err,result,count)=>{

				})
            }catch(err){
            	res.json({success:0,err:'database error'})
            }

            	//res.json(success)
                if (success.xml.return_code[0] === 'SUCCESS') {

                    const prepayId = success.xml.prepay_id[0]
                    const payParamsObj = getPayParams(prepayId, tradeId)
                    payParamsObj.price=price
                    // 返回给前端, 这里是 express 的写法
                    res.json({success:1,data:payParamsObj})
                } else {
                	res.json({success:0,data:null})
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
    var possible = cx_wechat.cx.possible;
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
