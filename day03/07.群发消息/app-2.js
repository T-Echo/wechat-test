/**
 * Created by Administrator on 2018/11/16 0016.
 */
const express = require('express');
const handleRequest = require('./reply/handleRequest-2');
const app = express();


//创建第三方中间件
app.use(handleRequest());


app.listen(3000,err => {
  if (!err) console.log('服务器连接成功');
  else console.log(err);
})


