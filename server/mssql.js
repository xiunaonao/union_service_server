let Connection= require('tedious').Connection
let Request = require('tedious').Request
let node_uuid=require('node-uuid')
let connectionCfg=require('../dataServer.json')
 //    server: '192.168.5.173',  
 //    userName: 'hm',
 //    password: '208hongmai',
	// options: { database: 'HmUnionBusiness' }  
//}


let sqlServer={
	connect:(callback)=>{
		let conn=new Connection(connectionCfg)
		conn.on('connect', (err)=>{
			if(err){
				console.log('连接失败')
				console.log(err)
				callback(null)
				return
			}else
		 		callback(conn)
		})
	},
	exec:(sqlStr,callback)=>{
		sqlServer.connect((conn)=>{
			console.log('连接数据库成功，开始查询sql语句:'+sqlStr)
			let _rowCount=0
			let request = new Request(sqlStr,(err, rowCount)=>{
		      if (err) {
		        console.error(err)
		        callback(err,[],0) //创建 request 实例失败
		      }else{
		      	//console.log(rowCount)
		      	_rowCount=rowCount
		      }
		    })
		    var _result = [];  
		    request.on('row', (columns,idx)=>{
				var obj = {}  
				columns.forEach((column)=>{
					if(column.value !== null){
						var key = column.metadata.colName
						var val = column.value
						obj[key] = val
					}
				});
		    	_result.push(obj)
		    })

		    request.on('requestCompleted',()=>{
		    	//console.log(_result)
		    	callback(null,_result,_rowCount)
		    })
		    conn.execSql(request)
		})
	},
	query:(table,where,callback,orderName,elseStr)=>{

		if(!where.size)
			where.size=20
		if(!where.page)
			where.page=1
		if(!where.filter)
			where.filter=''
		if(!where.order){
			if(!orderName)
				where.order='created_time'
			else
				where.order=orderName
		}
		if(!where.order_type)
			where.order_type='desc'
		where.order_type2=where.order_type=='desc'?'asc':'desc'
		if(where.filter)
			where.filter=' where delete_flag=0 '+where.filter
		if(!elseStr)
			elseStr=''
		else
			elseStr=','+elseStr

		let strSql=''
		// let topSql=`select top ${where.size*(where.page-1)} ${where.order} from ${table} ${where.filter}  order by ${where.order} ${where.orderType} `
		// strSql=`
		// 	select top ${where.size} * from ${table} where ${where.order}${where.orderType=='aes'?'>=':'<=1'}(select max(${where.order}) from (${topSql}) t)
		// 	 order by ${where.order} ${where.orderType}
		// `

		strSql=`
			select * ${elseStr} from ${table} m_table where id in
			(
				select top ${where.size} _ID from (select top ${where.size*where.page} ${where.order},_ID=id from ${table} ${where.filter} order by ${where.order} ${where.order_type}) w 
				order by ${where.order} ${where.order_type2}
			) 
			order by ${where.order} ${where.order_type}

			
		`
		console.log(where.filter)
		strNumber=`select count=count(id) from ${table} ${where.filter}`
		console.log(strNumber)
		sqlServer.exec(strSql,(err,result,count)=>{
			if(err){
				callback(err,[],0)
				return
			}
			sqlServer.exec(strNumber,(err,result2,count)=>{
				if(err){
					callback(err,[],0)
					return
				}
				if(result2[0].count<(where.size*where.page) && where.page>1){
					//23,40
					let result_now=[]
					let startIndex=(where.size*where.page)-result2[0].count;
					if(startIndex<20){
						for(let i=startIndex;i<result.length;i++){
							result_now.push(result[i])
						}
						result=result_now
					}else{
						result=[]
					}
				}

				callback(err,result,result2[0].count)
			})
		})
	},
	query_dating:(table,where,callback,isagain)=>{
		if(!where.size)
			where.size=20
		if(!where.page)
			where.page=1
		if(!where.filter)
			where.filter=''
		if(!where.order){
				where.order='id desc'
		}
		if(where.filter)
			where.filter=' delete_flag=0 '+where.filter


        if (where.page == 1 && !isagain){
        	console.log('首次匹配');
			sqlServer.exec(`exec dbo.p_matchMembers '${where.openid}','${where.filter}'`,(err,result,count)=>{
				queryNow()
			})
		}else{
			queryNow()
		}


		function queryNow(){
			let str_all=`
				id=(select id from dating_member_info where openid=match_openid)
				,day_of_birth=(select day_of_birth from dating_member_info where openid=match_openid)
				,member_name=(select member_name from dating_member_info where openid=match_openid)
				,head_img=(select head_img from dating_member_info where openid=match_openid)
				,height=(select height from dating_member_info where openid=match_openid)
				,weight=(select weight from dating_member_info where openid=match_openid)
				,is_like=(select (count(id)) from dating_mind_member where openid=d.openid and mind_openid=match_openid)
			`
			sqlServer.exec(`
				declare @RecordCount int;
				exec Page_Query 'dating_match_members d','did=d.id,openid,match_openid,score,else_score,mind_count,${str_all}','${where.order}',${where.size},${where.page},'openid=''${where.openid}''',0,@RecordCount output

				`,(err,result,count)=>{
					if(callback){
						callback(err,result,count)
					}
				})
		}
	},
	update:(table,rows,where,callback)=>{

		function valid_null(key){
			if(!rows[key].value){
				if(!rows[key].type)
					rows[key].value=""
				if(rows[key].type=='num')
					rows[key].value=0
				if(rows[key].type=='date')
					rows[key].value="1970-01-01"
				if(rows[key].type=='bool')
					rows[key].value=0
			}
			if(!rows[key].type || rows[key].type=='date' || rows[key].type=='id')
				rows[key].value="'"+rows[key].value+"'"
			return rows[key].value
		}

		let rowkey=Object.keys(rows)
		let colName=rowkey.join(',')
		let rowValue=''
		for(let i=0;i<rowkey.length;i++){
			if(i!=0)
				rowValue+=","
			rowValue+=rowkey[i]+'='+valid_null(rowkey[i])
		}

		strSql=`
			UPDATE ${table}
			   SET ${rowValue}
			 WHERE ${where}

		`
		sqlServer.exec(strSql,(err,result,count)=>{
			callback(err,result,count)
		})
	},
	insert:(table,rows,callback)=>{
		//let new_id=node_uuid.v1()
		function valid_null(key){
			if(!rows[key].value){
				if(!rows[key].type)
					rows[key].value=""
				if(rows[key].type=='num')
					rows[key].value=0
				if(rows[key].type=='date')
					rows[key].value="1900-01-01"
				if(rows[key].type=='bool')
					rows[key].value=0
			}
			if(!rows[key].type || rows[key].type=='date')
				rows[key].value="'"+rows[key].value+"'"
			return rows[key].value
		}
		let rowkey=Object.keys(rows)
		let colName=rowkey.join(',')
		let rowValue=''
		for(let i=0;i<rowkey.length;i++){
			if(i!=0)
				rowValue+=","
			rowValue+=valid_null(rowkey[i])
		}

		strSql=`
			INSERT INTO ${table}(${rowkey}) VALUES
     		(
     			${rowValue}
     		)
		`
		sqlServer.exec(strSql,(err,result,count)=>{
			callback(err,result,count)
		})
	},
	delete:(table,where,callback)=>{
		strSql=`
			update ${table} set delete_flag=1 where ${where}
		`
		sqlServer.exec(strSql,(err,result,count)=>{
			callback(err,result,count)
		})
	},
	remove:function(table,where,callback){
		strSql=`
			delete ${table} where ${where}
		`
		sqlServer.exec(strSql,(err,result,count)=>{
			callback(err,result,count)
		})
	},
	exist:(table,where,callback)=>{
		let strSql=`
			select top 1 id from ${table} where ${where}
		`
		sqlServer.exec(strSql,(err,result,count)=>{
			callback(err,result,count)
		})
	},
	querySingle:(table,where,callback)=>{
		strSql=`
			select * from ${table} where ${where}
		`
		sqlServer.exec(strSql,(err,result,count)=>{
			callback(err,result,count)
		})
	}
}

// sqlServer.query('Test',{},(err,r,c)=>{
// 	console.log(r)
// })

module.exports=sqlServer