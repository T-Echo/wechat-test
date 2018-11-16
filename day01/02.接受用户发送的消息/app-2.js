/**
 * Created by Administrator on 2018/11/16 0016.
 */
const express = require('express');
const sha1 = require('sha1');
const {getUserDataAsync,parseXMLDataAsync,formatMessage} = require('./utils/tools-2');
const app = express();

const config = {
  appID:'wx0b00385010c9887a',
  appsecret:'3e99a1a48c80bd7e637c1c02126829f8',
  token:'TIANSHAUNG0810test'
}


//创建路由
app.use(async (req,res,next) => {
  //获取请求参数
  const {signature,echostr,timestamp,nonce} = req.query;
  const {token} = config;
  //将token，timestamp，nonce排序、合并、加密
  const str = sha1([token,timestamp,nonce].sort().join(''));
  //判断微信服务器发送过来的消息请求方式
  if (req.method === 'GET'){
    //验证微信服务器的有效性
    if (str === signature){
      //说明是微信服务器发送的消息，将echostr返回
      res.end(echostr);
    }else{
      res.end('error');
    }
  }else if(req.method === 'POST'){
    //验证消息是否来自微信服务器，如果不是，就返回错误，并且return
    if (signature !== str){
      res.end('error');
      return;
    }

    //用户发送的消息在请求体，要拿到请求体的数据，并且要等到拿到数据之后再执行后面的代码，封装一个函数用promise包起来
    //并且拿到的是xml类型的数据
    const xmlData = await getUserDataAsync(req);

    //将发送过来的xml消息解析成js对象，拿到js对象之后再执行后面的代码,将xml数据作为参数传入
    const jsData = await parseXMLDataAsync(xmlData);

    //格式化数据，拿到需要的数据，把多余的干扰数据去除掉，将jsData数据作为参数传入
    //这个不是异步任务，不用await，也不用外面包promise
    //message接收的是formatMassage函数的返回值（格式化完的数据----用户发送的消息）
    const message = formatMessage(jsData);

    //初始化一个消息文本
    let content = '你说啥，听不懂';

    //判断用户发送的消息内容，根据内容返回特定的响应
    if (message.Content === '1'){
      content = '大吉大利，今晚吃鸡';
    }else if (message.Content === '2'){
      content = '落地成盒';
    }else if(message.Content === '3'){
      content = '伏地能手';
    };

    //将消息文本转成xml格式
    let replayMessage = `<xml>
        <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName>
        <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
        <CreateTime>${Date.now()}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[${content}]]></Content>
      </xml>`

    //将xml格式的消息文本返回响应给微信服务器
    res.send(replayMessage);

  }else{
    //说明不是get，也不是post方式，返回错误
    res.end('error');
  }
})


app.listen(3000,err => {
  if (!err){
    console.log('服务器启动成功');
  }else{
    console.log(err);
  }
})