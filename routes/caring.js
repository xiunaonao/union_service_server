let express=require('express')
let router=express.Router()
let mssql=require('../server/mssql')
let wechat=require('../server/wechat_free')
let union_wechat={appid:'wxb5ed549f53f1ba99',secret:'9e2e9837c28f3f849613c23cd1aa9a81'}


router.get('/base',(req,res,next)=>{
	mssql.exec('select * from caring_base',(err,result,count)=>{
		if(err){
			res.json({success:0,msg:'data error'})
		}else{
			console.log(result)
			res.json({success:1,data:result})
		}
	})
})

router.get('/income',(req,res,next)=>{
	let query = req.query

	let where=base_where(query)

	mssql.query('caring_income_info',where,(err,result,count)=>{
		if(err){
			res.json({success:0})
		}else{
			res.json({success:1,data:result})
		}
	})
})


router.get('/expenditure',(req,res,next)=>{
	let query=req.query

	let where=base_where(query)

	mssql.query('caring_expenditure',where,(err,result,count)=>{
		if(err){
			res.json({success:0})
		}else{
			res.json({success:1,data:result})
		}
	})
})

router.get('/get_wechat_user',(req,res,next)=>{
	let query=req.query

	if(!query.code){
		res.json({success:false,msg:'请传递code'})
		return
	}
	let code=query.code
	wechat.get_web_token(code,(err,body)=>{
		if(err){
			res.json({success:0})
		}else{
			res.json({success:1,data:body})
		}
	},union_wechat)

})

router.get('/get_wechat_user_test',(req,res,next)=>{
	let query=req.query
	if(query.pwd!='zxw233'){
		res.json({success:0})
		return
	}
	res.json({"success":1,"data":{"subscribe":1,"openid":"om-NlwIIEXNK_ghTdb_-U-lNhz8g","nickname":"ᕕ(ᐛ)ᕗ变身!","sex":1,"language":"zh_CN","city":"杭州","province":"浙江","country":"中国","headimgurl":"http://thirdwx.qlogo.cn/mmopen/ePlP89AExr1k6TjdBrKTTWDz43qgj27JTkSnrreZBTcTRv8R0fCic1tfw5y1pt1xLxgXx5BBOicyiaqT35VAGlFuxf0GYoiajfng/132","subscribe_time":1535342375,"unionid":"oR0vSwEa-x8btIwgoxXgDSItZCyY","remark":"","groupid":0,"tagid_list":[],"subscribe_scene":"ADD_SCENE_SEARCH","qr_scene":0,"qr_scene_str":""}})
})


function base_where(query){
	let where={
		size:query.size?parseInt(query.size):20,
		page:query.page?parseInt(query.page):1,
		filter:query.filter?query.filter:'',
		order:query.order?query.order.split(' ')[0]:'id',
		order_type:(query.order && query.order.split(' ').length>1)?query.order.split(' ')[1]:'desc'
	}
	return where 
}


module.exports=router