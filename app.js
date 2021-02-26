// 引入express模块
const express=require('express')
// 引入cors模块
const cors=require('cors');
// 引入中间件body-parser
const bodyParser=require('body-parser')
// 引入mysql模块，创建连接池
const mysql=require('mysql');
// 引入MD5
const MD5=require('MD5')
// 创建服务器对象
const server=express();

// 中间件cors
server.use(cors({
    origin:['http://localhost:8080','http://176.18.8.11:8080/']
}));
// 中间件body-parser
server.use(bodyParser.urlencoded({
    extended:false
}))

// 创建连接池
const pool=mysql.createPool({
    host:'176.18.8.11',
    port:'3306',
    user:'root',
    password:'',
    database:'web2010',
    connectionLimit:'20'
});
// 接口

//用户登录接口
server.post('/login', (req,res)=>{
    let phone=req.body.phone;
    let password=req.body.password;
    //SQL语句
    let sql='select id,phone from web_user where phone=? and password=md5(?)';
    pool.query(sql,[phone,password],(error,results)=>{
        if(error) throw error;
        if(results.length==0){
            res.send({
                message:'login failde',
                code:201
            });
        }else{
            res.send({
                message:'ok',
                code:200,
                results:results[0]
            })
        }
    })
});



//注册接口
server.post('/register',(req,res)=>{
    let phone=req.body.phone;
    let password=req.body.password;
    //sql语句
    let sql="select count(id) as count from web_user where phone=?";
    pool.query(sql,[phone],(error,results)=>{
        if(error) throw error;
        let count=results[0].count;
        if(count==0){
            sql="insert into web_user(phone,password) values(?,md5(?))";
            pool.query(sql,[phone,password],(error,results)=>{
                if (error) throw error;
                res.send({
                    message:"ok",
                    code:200
                });
            });
        }else{
            res.send({
                message:"userexists",
                code:201
            });
        }
    });
});


//修改个人资料接口
server.post('/profile',(req,res)=>{
    let info=req.body;
    let sql="UPDATE web_user set nickname=?,phone=?,email=?,sex=?,birthday=? WHERE id=?";
    pool.query(sql,[info.nickname,info.phone,info.email,info.sex,info.birthday,info.id],(error,results)=>{
        if (error) throw error;
        res.send({
            code:200,
            mag:'success'   
        });
    })
})


//个人资料查询
server.get('/profiles',(req,res)=>{
    let id=req.query.id;
    let sql="select user_pic,nickname,phone,email,sex,birthday from web_user where id=?";
    pool.query(sql,[id],(error,result)=>{
        if (error) throw error;
        res.send(result[0])
    })
})


// 列表查询排序
server.get('/list',(req,res)=>{
    var id=req.query.id;
    let rid=req.query.rid;
    let sort=req.query.sort;
    if(sort==3){
        sort=0
    }
    if(rid==0&&sort==1){
        // 全部价格降序
        var sql='select id,image01,title,title01,title02,price from web_list where category_id=? order by sales_volume desc'
    }
    if(rid==0&&sort==2){
        // 全部销量降序
        var sql='select id,image01,title,title01,title02,price from web_list where category_id=? order by price desc'
    }
    if(rid!=0&&sort==1){
        // 小类销量降序
        var sql='select id,image01,title,title01,title02,price from web_list where category_id=? and relation_id=? order by sales_volume desc'
    }
    if(rid!=0&&sort==2){
        // 小类价格降序
        var sql='select id,image01,title,title01,title02,price from web_list where category_id=? and relation_id=? order by price desc'
    }
    if(rid==0&&sort==0){
        // 默认搜索全部
        var sql='select id,image01,title,title01,title02,price from web_list where category_id=?'
    }
    if(rid!=0&&sort==0){
        // 搜索小类
        var sql='select id,image01,title,title01,title02,price from web_list where category_id=? and relation_id=?';
    }
    if(isNaN(id)){
        var id='%'+id+'%';
        var sql="select id,image01,title,title01,title02,price from web_list where keyword like ?"
    }
    
    pool.query(sql,[id,rid],(err,result)=>{
        if(err)throw err;
        res.send(result)
    })
})
// 首页情人节商品请求
server.get('/index',(req,res)=>{
    let sql='select id, image01,title,title02,price from web_list where id in (1,2,3,4)';
    pool.query(sql,(err,result)=>{
        if(err)throw err;
        res.send(result)
    })
})
// 请求首页列表商品
server.get('/index_list',(req,res)=>{
    let id=req.query.id;
    let num=parseInt(req.query.num)
    let sql='select id,image01,title,title01,title02,flower_means,price,sales_volume from web_list  where category_id=? limit ?,6';
    pool.query(sql,[id,num],(err,result)=>{
        if(err)throw err;
        res.send(result)
    })
})
// 请求商品详情
server.get('/details',(req,res)=>{
    let id=req.query.id
    let sql='select image01,image02,image03,image04 from web_list where id=?';
    pool.query(sql,[id],(err,image)=>{
        if(err) throw err;
        if(image.length==0){
            // 发送空数组
            res.send({image:image[0]})
        }else{
            let sql='select id,title,title01,title02,price,sales_volume,flower_means,material,package,area,type01,image_text01,image_text02,image_text03,image_text04,image_text05 from web_list where id=?';
            pool.query(sql,[id],(err,result)=>{
                if(err) throw err;
                // 查询评论
                let sql='select id,star,content,com_image01,com_image02,comment_time,user_id,user_pic,nickname from web_comment where list_id=? limit 1,1';
                pool.query(sql,[id],(err,results)=>{
                    if(err) throw err;
                    res.send({image:image,result:result,results:results})
                })
            })
        }
        
    })
    
})

// 请求全部评论
server.get('/comment',(req,res)=>{
    let id=req.query.id
    let sql='select id,star,content,com_image01,com_image02,user_id,user_pic,nickname from web_comment where list_id=?';
    pool.query(sql,[id],(err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})
// 添加到购物车
server.post('/incart',(req,res)=>{
    let obj=req.query
    let sql='insert into web_cart(list_id,image,title,quantity,price,type,user_id) values (?,?,?,?,?,?,?)'
    pool.query(sql,[obj.id,obj.image,obj.title,obj.num,obj.price,obj.type,obj.user_id],(err,result)=>{
        if(err) throw err;
        if(result.affectedRows!=0){
            res.send({msg:'ok',code:200})
        }else{
            res.send({mse:'err',code:400})
        }
    })
})
// 请求猜你喜欢
server.get('/guess',(req,res)=>{
    let page=parseInt(req.query.page) 
    let sql='select id,image01,title01,price from web_list limit ?,6'
    pool.query(sql,[page],(err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})

// 请求分类页面数据
server.get('/typeImage',(req,res)=>{
    let id=req.query.id
    let sql='select id,image from web_typeImage where type_id=?'
    pool.query(sql,[id],(err,result)=>{
        if(err)throw err;
        let sql='select id,image,text from web_type where type_id=?';
        pool.query(sql,[id],(err,results)=>{
            if(err) throw err
            res.send({result:result,results:results})
        })
    })
})
// 设置端口号
server.listen(3000,()=>{
    console.log('server is running......');
});