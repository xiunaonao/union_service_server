var express = require('express');
var router = express.Router();
let mssql=require('../server/mssql')
let wechat=require('../server/wechat')

/* GET users listing. */
router.get('/', (req, res, next)=>{
	mssql.insert()
});

router.get('/wechat',(req,res,next)=>{
	let url=encodeURIComponent('http://service.123zou.com/#/jt/signin').toLocaleLowerCase()
	let appid='wx7bc344f62f4fdaa3'
	res.redirect(`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${url}&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect`)
})

router.get('/wechat_user',(req,res,next)=>{
	let code =req.query.code
	wechat.get_web_token(code,(err,body)=>{
		console.log(body)
		console.log('error')
		if(!err)
			res.json(body)
		else
			res.json({success:false})
	},code)
})

router.get('/live_list',(req,res,next)=>{
	
})

router.get('/live_latest',(req,res,next)=>{
	
})

module.exports = router;
