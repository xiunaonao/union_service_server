let request=require('request')
request=request.defaults({jar: true})



function get_token(callback,wechat_token){
	let url=`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${wechat_token.appid}&secret=${wechat_token.secret}`
	get(url,(body)=>{
		if(body.errcode){
			callback(body.errcode)
		}else{
			console.log(typeof body)
			console.log(body.access_token)
			callback(body.access_token)
		}
	})

}

function get_web_token(code,callback,wechat_token){
	let url=`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${wechat_token.appid}&secret=${wechat_token.secret}&code=${code}&grant_type=authorization_code`
	console.log(url)
	get(url,(body)=>{
		console.log(body)
		if(body.errcode){
			callback(body.errcode)
		}else{
			get_user(body.openid,(error,body2)=>{
				callback(error,body2)
			},wechat_token)
			//callback(null,body.openid)
		}
	})
}

function get_user(openid,callback,wechat_token){
	get_token((token)=>{
		let url=`https://api.weixin.qq.com/cgi-bin/user/info?access_token=${token}&openid=${openid}&lang=zh_CN`
		get(url,(body)=>{
			console.log(body)
			if(body.errcode){
				callback(body.errcode)
			}else{
				callback(null,body)
			}
		})

	},wechat_token)
}

function set_menu(callback){
	get_token((token)=>{
		let url=`https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${token}`
		let menu= {
		     "button":[
		      {
		           "name":"接听意愿",
		           "sub_button":[
		           	{    
		               "type":"view",
		               "name":"拦截种类",
		               "url":"http://fsr.calltrace.cn/setting/type"
		            },
		            {
		               "type":"view",
		               "name":"黑名单设置",
		               "url":"http://fsr.calltrace.cn/setting/roster?type=-1"
		            },
		            {
		            	"type":"view",
		            	"name":"允许通话名单",
		            	"url":"http://fsr.calltrace.cn/setting/roster?type=1"
		            }
		            ]
		       },{
		       		"name":"个人中心",
		       		// "type":"view",
		       		// "url":"http://fsr.calltrace.cn/users/"
		       		"sub_button":[
			       		{
			       			"type":"view",
			       			"name":"个人中心",
			       			"url":"http://fsr.calltrace.cn/users/"	
			       		},
			       		{
			       			"type":"view",
			       			"name":"注册账号",
			       			"url":"http://fsr.calltrace.cn/register"
			       		}
		       		]
		       },{
		       	"name":"关于我们",
		       	"sub_button":[
			       	{
			       		"type":"click",
			       		"name":"公众号介绍",
			       		"key":"about_us"
			       	},
			       	{
			       		"type":"click",
			       		"name":"行业信息",
			       		"key":"hyxx"
			       	},
			       	{
			       		"type":"click",
			       		"name":"相关新闻",
			       		"key":"news"
			       	}
		       	]
		       }]
		 }
		//  let menu={
		//  	"button":[
		//  	{"name":"拦截种类","sub_button":[
		//  		{"type":"view","name":"拦截种类","url":"http://210.56.209.61/setting/type"},
		//  		{"type":"view","name":"拦截号码","url":"http://210.56.209.61/setting/type"},
		//  		]
		//  	}
		//  ]
		// }

		post(url,menu,(body)=>{
			callback(body)
		}) 
	})
}


function notice(data,callback){
	//let openid='oy84s1FY0bf1k0gk2bEBbWuAbpqM'
	let openid=data.openid
	get_token((token)=>{
		let url=`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`
		let date=new Date().getFullYear()+'-'+(new Date().getMonth()+1)+'-'+new Date().getDate()+' '+new Date().getHours()+':'+new Date().getMinutes()+':'+new Date().getSeconds()
		let obj={
			"touser":openid,
			"template_id":"gkyuaUsstSmTqXuhF18NfN-4PI9mxqXpPPvjXDpq3QI",
			"url":data.url,
			"topcolor":"#FF0000",
			"data":{
				first:{value:'骚扰电话拦截',color:'#333'},
				keyword1:{value:data.date,color:'#333'},
				keyword2:{value:data.number,color:'#E30'},
				keyword3:{value:data.content,color:'#333'},
				remark:{value:data.remark,color:'#333'}
			}
		}
		post(url,obj,(body)=>{
			callback(body)
		})
	})

	/*
		{{first.DATA}}
		来电日期：{{keyword1.DATA}}
		来电号码：{{keyword2.DATA}}
		拦截原因：{{keyword3.DATA}}
		{{remark.DATA}}
	*/

}

function boss_note(data,callback){
	let openid=data.openid
	get_token((token)=>{

		let url=`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`
		let date=new Date().getFullYear()+'-'+(new Date().getMonth()+1)+'-'+new Date().getDate()+' '+new Date().getHours()+':'+new Date().getMinutes()+':'+new Date().getSeconds()
		let obj={
			"touser":openid,
			"template_id":"PjXBrZn7VQgJ5Q5g44wp5AuO4ZW4EJlE4Y-ACX2OuYc",
			"url":data.url,
			"topcolor":"#FF0000",
			"data":{
				first:{value:'订阅成功提醒',color:'#333'},
				type:{value:'防骚扰服务订阅',color:'#333'},
				date:{value:date,color:'#333'},
				tel:{value:data.number,color:'#E30'},
				time:{value:date,color:'#333'},
				//remark:{value:data.remark,color:'#333'}
			}
		}
		post(url,obj,(body)=>{
			callback(body)
		})
	})
}


module.exports={
	set_menu:set_menu,
	get_web_token:get_web_token,
	get_user:get_user,
	send_notice:notice,
	boss_note:boss_note
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