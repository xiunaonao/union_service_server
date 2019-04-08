let express=require('express')
let router=express.Router()
let mssql=require('../server/mssql')




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

router.get('/news')


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