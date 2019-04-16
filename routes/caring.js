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