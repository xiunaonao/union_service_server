let express=require('express')
let router=express.Router()
let mssql=require('../server/mssql')
let wechat=require('../server/wechat_free')
let union_wechat=require('../dataWechat.json').cx.wechat;


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

router.post('/income_add',(req,res,next)=>{
	let body=req.body
	let openid=body.openid
	let name=body.name
	let headimgurl=body.headimgurl
	let created_time=new Date().getFullYear()+'-'+(new Date().getMonth()+1)+'-'+new Date().getDate()+' '+new Date().getHours()+':'+new Date().getMinutes()+':'+new Date().getSeconds()
	let amount=body.price
	let pid=20190501
	let remark=body.remark
	res.set({
		'Access-Control-Allow-Origin': '*'
	})
	mssql.insert('caring_income_info',{
		openid:{
			type:'',
			value:openid
		},
		member_name:{
			type:'',
			value:name
		},
		head_url:{
			type:'',
			value:headimgurl
		},
		created_time:{
			type:'date',
			value:created_time
		},
		amount:{
			type:'num',
			value:amount
		},
		project_id:{
			type:'num',
			value:pid
		},
		remark:{
			type:'',
			value:remark
		}
	},(err,result,count)=>{
		if(err){
			res.json({success:0,msg:'database error',err:err})
		}else{
			res.json({success:1})
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
	res.json(require('../dataWechat.json').cx.test)
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