var express = require('express');
var router = express.Router();
let mssql=require('../server/mssql')
let wechat=require('../server/wechat_free')

let dateWechat=require('../dataWechat.json').date;
/* GET users listing. */
router.get('/', (req, res, next)=>{
	mssql.insert()
});

router.get('/wechat',(req,res,next)=>{
	let url=encodeURIComponent('http://service.123zou.com/#/jt/signin').toLocaleLowerCase()
	let appid=dateWechat.wechat.appid;
	res.redirect(`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${url}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`)
})

router.get('/wechat_user',(req,res,next)=>{
	let code =req.query.code;
	let token=dateWechat.wechat;
	wechat.get_web_token(code,(err,body)=>{
		console.log(body)
		console.log('error')
		if(!err)
			res.json({success:1,data:body})
		else
			res.json({success:0,data:null})
	},token)
})



router.post('/new_user',(req,res,next)=>{
	let openid=req.body.openid
	let name=req.body.name
	let headimg=req.body.headimg
	let rose=1
	mssql.exist('jt_member_info',` openid='${openid}' `,(err,result,count)=>{
		res.set({
			'Access-Control-Allow-Origin': '*'
		})
		if(err){
			res.json({success:0})
			return
		}
		if(count>0){
			res.json({success:1,msg:'已存在的用户'})
		}else{
			mssql.insert('jt_member_info',{
				openid:{
					type:'',
					value:openid
				},
				name:{
					type:'',
					value:name
				},
				headimg:{
					type:'',
					value:headimg
				},
				rose:{
					type:'num',
					value:rose
				}

			},(err,result,count)=>{
				if(err){

				}else{
					if(count>0){
						res.json({success:1})
						return
					}
				}
				res.json({success:0})
			})
		}
	})
})

router.post('/sign_now',(req,res,next)=>{
	let openid=req.body.openid
	let today=dateStr(new Date(),true)

	mssql.exist('jt_sign_info',` openid='${openid}' and created_time>='${today}' `,(err,result,count)=>{
		res.set({
			'Access-Control-Allow-Origin': '*'
		})
		if(err){
			res.json({success:0,err:err})
			return
		}
		if(count>0){
			res.json({success:0,msg:'今日已签到'})
		}else{
			mssql.insert('jt_sign_info',{
				activity_id:{type:'num',value:1},
				created_time:{type:'',value:dateStr(new Date())},
				openid:{type:'',value:openid}
			},(err,result,count)=>{
				if(err){
					res.json({success:0,msg:'网络异常'})
					return
				}
				if(count>0){
					res.json({success:1,msg:'签到成功',date:new Date().toISOString()})
				}else{
					res.json({success:1,msg:'操作失败'})
				}
			})
		}
	})

})

router.get('/live_list',(req,res,next)=>{
	
})

router.get('/live_latest',(req,res,next)=>{
	
})

function dateStr(date,isshort){
	let day=date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()
	let time=date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()
	if(isshort)
		return day
	else 
		return day+' '+time
}

module.exports = router;
