var express = require('express');
var router = express.Router();
let mssql=require('../server/mssql')
let wechat=require('../server/wechat_free')

/* GET users listing. */
router.get('/', (req, res, next)=>{
	mssql.insert()
});

router.get('/wechat',(req,res,next)=>{
	let url=encodeURIComponent('http://service.123zou.com/#/jt/signin').toLocaleLowerCase()
	let appid='wxc2928955e4ac8dde'
	res.redirect(`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${url}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`)
})

router.get('/wechat_user',(req,res,next)=>{
	let code =req.query.code
	let token={
		appid:'wxc2928955e4ac8dde',
		secret:'b5477eb1bc90748873eec91e7669dbde'
	}
	wechat.get_web_token(code,(err,body)=>{
		console.log(body)
		console.log('error')
		if(!err)
			res.json({success:1,data:body})
		else
			res.json({success:0,data:null})
	},token)
})


router.get('/wechat_user_test',(req,res,next)=>{
	let pwd=req.query.code
	if(pwd!='cx123')
		return
	let json={success:1,data:{"subscribe":1,"openid":"offw_w83EMhd5vk1EisV0BHUZrEY","nickname":"MarryU爱情咖啡馆(长兴店)","sex":2,"language":"zh_CN","city":"湖州","province":"浙江","country":"中国","headimgurl":"http://thirdwx.qlogo.cn/mmopen/QxH1Q7lAFxSMadSJLhaSm9J4zLXxs25v33TDjyKQqdumd3heUpB0NzaMqgHafylKRUzeHBjqJWdEI5qI2KVKic93SZqU0ZBWia/132","subscribe_time":1554118840,"remark":"","groupid":0,"tagid_list":[],"subscribe_scene":"ADD_SCENE_SEARCH","qr_scene":0,"qr_scene_str":""}}
	res.set({
		'Access-Control-Allow-Origin': '*'
	})
	res.json(json)
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
					if(count>0)
						res.json({success:1})
				}
				res.json({success:0})
			})
		}
	})
})

router.post('/sign_now',(req,res,next)=>{
	let openid=req.query.openid
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
			mssql.insert('jt_sgin_info',{
				acitivity_id:1,
				created_time:dateStr(new Date()),
				openid:openid
			},(err,result,count)=>{
				if(err){
					res.json({success:0,msg:'网络异常'})
					return
				}
				if(count>0){
					res.json({success:1,msg:'签到成功',date:new Date()toISOString()}})
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
