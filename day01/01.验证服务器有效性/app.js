/**
 * Created by Administrator on 2018/11/16 0016.
 */
const express = require('express');
const sha1 = require('sha1');
const app = express();



const config = {
  appID:'wx0b00385010c9887a',
  appsecret:'3e99a1a48c80bd7e637c1c02126829f8',
  token:'TIANSHAUNG0810test'
}

app.use((req,res,next) => {
  //获取请求参数
  const {signature, echostr, timestamp, nonce} = req.query;
  const {token} = config;

  //拼在一起
  const str = sha1([timestamp, nonce, token].sort().join(''));
  //判断
  if(signature === str){
    res.end(echostr);
  }else{
    res.end('error');
  }
})


app.listen(3000, err => {
  if (!err){
    console.log('服务器连接成功');
  }else{
    console.log(err);
  }
})