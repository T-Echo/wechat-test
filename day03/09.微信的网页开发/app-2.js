/**
 * Created by Administrator on 2018/11/16 0016.
 */
const express = require('express');
const sha1 = require('sha1');
const Wechat = require('./wechat/wechat');
const handleRequest = require('./reply/handleRequest-2');
const {url, appID} = require('./config');
const wechat = new Wechat();

const app = express();

//配置ejs
app.set('views' , 'views');
app.set('view engine' , 'ejs');

//创建微信网页开发的路由，要在中间件之前创建，中间件会接收所有请求
app.get('/search' , async (req , res) => {
  //得到临时票据ticket
  const {ticket} = await wechat.fetchTicket();
  //生成随机字符串
  const noncestr = Math.random().toString().split('.')[1];
  //时间戳,Date.now()单位秒，除以1000后向下取整
  const timestamp = parseInt(Date.now() / 1000);
  //将四个参数按照key = value的方式组合成一个数组,
  //拿到ticket、noncestr、timestamp是为了得到加密签名signature
  const arr = [
    `noncestr=${noncestr}`,
    `jsapi_ticket=${ticket}`,
    `timestamp=${timestamp}`,
    `url=${url}/search`,
  ]
  //对数组进行字典序排序、以&符拼接、sha1加密，得到加密签名signature
  const signature = sha1(arr.sort().join('&'));
  //ejs将数据渲染到页面
  res.render('search',{
    signature,
    timestamp,
    noncestr,
    appID
  })



})


//创建第三方中间件
app.use(handleRequest());


app.listen(3000,err => {
  if (!err) console.log('服务器连接成功');
  else console.log(err);
})


