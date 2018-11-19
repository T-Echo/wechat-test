/**
 * Created by Administrator on 2018/11/17 0017.
 */
const rp = require('request-promise-native');
const {writeFile,readFile,createReadStream} = require('fs');
const {appID,appsecret} = require('../config');
const api = require('../api');

//定义一个类，用来获取、读取、保存、判断是否过期 access_token
class Wechat{

  //获取access_token
  //注：执行async函数返回值是promise对象，promise对象里面有return的数据，
  //当调用这个函数时，并不能拿到return的数据，需要在调用时前面加上await，因为await默认拿到后面promise的返回值
  async getAccessToken(){
    //定义请求地址，用到两个参数appID和appsecret，这两个参数在config中，所以要引入config
    const url = `${api.accessToken}appid=${appID}&secret=${appsecret}`;

    //发送请求，请求成功后得到一个json格式的数据，包含access_token和expires_in；
    //rp是引用的第三方模块，调用rp返回值是promise对象，json:true将收到的json格式数据转成js对象
    const result = await rp({method:'GET',url,json:true});
    //设置access_token的过期时间
    result.expires_in = Date.now() + 7200000 - 300000;
    //返出请求成功后得到的数据
    return result;
  }

  //保存access_token,保存到一个文件中，方便使用，要用到fs模块操作文件
  //将要保存的access_token和文件路径filePath作为参数传入,调用这个函数返回值是promise对象
  saveAccessToken(filePath,accessToken){
    return new Promise((resolve,reject) => {
      //写入文件,accessToken的类型是js对象，js对象没法存储，要转化成json字符串
      //因为是异步任务，包一个promise
      writeFile(filePath,JSON.stringify(accessToken),err => {
        if (!err){
          //如果没有错误，就调用成功的回调
          resolve();
        }else{
          //如果出错就调用失败的回调
          reject('saveAccessToken出错' + err);
        }
      })
    })
  }

  //读取access_token,将文件路径作为参数传入，调用函数返回值是promise对象
  readAccessToken(filePath){
    return new Promise((resolve,reject) => {
      readFile(filePath,(err,data) => {
        if (!err){
          //读取的data(access_token)是二进制数据，要先toString()转成json字符串，再转成js对象
          resolve(JSON.parse(data.toString()));
        }else{
          reject('readAccessToken方法出错' + err);
        }
      })
    })
  }

  //判断expires_in是否过期
  isValidAccessToken({expires_in}){
    //三元表达式简写，条件成立（没过期）返回true，条件不成立（过期）返回false
    return Date.now() < expires_in;
  }


  //获取有效access_token的方法，为什么返回值必须是promise对象？
  fetchAccessToken(){
    //第二次会进来这个判断，判断实例对象上有没有access_token和expires_in，
    //并且判断是不是有效，如果有并且有效就返回有效的access_token
    if (this.access_token && this.expires_in && this.isValidAccessToken(this)){
      //实例对象有很多其他属性方法，这里只用到access_token和expires_in，所以返回值用对象的方式，并包装成promise对象
      return Promise.resolve({access_token:this.access_token,expires_in:this.expires_in});
    }

    //调用读取access_token的函数,因为是分两种情况，用async..await..麻烦，这里用.then().catch()
    //返回值是promise对象，所以可以.then()，.then()、.catch()的返回值是内部函数的返回值
    return this.readAccessToken('./accessToken.txt')
    //如果有保存的accessToken,判断有没有过期
      .then(async res => {
        if (this.isValidAccessToken(res)){
          console.log(res);
          //没过期，直接使用
          console.log('没有过期，直接使用');
          //return的res包着promise
          return res;
        }else{
          //过期了,重新获取并保存
          const accessToken = await this.getAccessToken();
          await this.saveAccessToken('./accessToken.txt',accessToken);
          //return的accessToken包着promise
          return accessToken;
        }
      })
      //如果没有accessToken,就调用getAccessToken获取access_token，然后调用saveAccessToken保存
      .catch(async err => {
        const accessToken = await this.getAccessToken();
        await this.saveAccessToken('./accessToken.txt',accessToken);
        //return的accessToken包着promise
        return accessToken;
      })
      .then(res => {
        //不管成功还是失败都会进来这里，将access_token和expires_in添加到实例对象的属性上
        this.access_token = res.access_token;
        this.expies_in = res.expires_in;
        //返回值需要包着promise，可以在函数前加上async，这样返回值包着promise，
        //也可以用Promise的resolve方法将返回值包装成promise对象，并且是成功的状态
        return Promise.resolve(res);
      })
  }

  //创建菜单，将菜单模板作为参数传入
  async createMenu(menu){
    try{
      //获取access_token,通过this调用fetchAccessToken()
      //注：方法有归属，要指明是哪个对象的方法，定义在对象中的方法和属性需要对象本身调用
      const {access_token} = await this.fetchAccessToken();
      //定义请求地址
      const url = `${api.menu.create}access_token=${access_token}`;
      //发送请求,返回值是包着promise的对象
      const result = await rp({method:'POST',url,json:true,body:menu});
      return result;
    }catch (e){
      return 'createMenu方法出错' + e;
    }
  }

  //删除菜单
  async deleteMenu(){
    try{
      const {access_token} = await this.fetchAccessToken();
      const url = `${api.menu.delete}access_token=${access_token}`;
      const result = await rp({method:'GET',url,json:true});
      return result;
    }catch (e){
      return 'deleteMenu方法出错' + e;
    }
  }

  //创建标签，返回值是标签id和标签名，{"tag":{"id":134, "name":"广东"}}
  async createTag(name){
    try{
      const {access_token} = await this.fetchAccessToken();
      const url = `${api.tag.create}access_token=${access_token}`;
      return await rp({method:'POST',url,json:true,body:{"tag":{name}}});
    }catch(e){
      return 'createTag方法出错' + e;
    }
  }
  //获取标签下粉丝列表，返回值有 count获取粉丝的数量、data粉丝列表、next_openid拉取列表中最后一个用户的openid
  //{"count":2,//这次获取的粉丝数量
  // "data":{//粉丝列表
  //    "openid":[
  //       "ocYxcuAEy30bX0NXmGn4ypqx3tI0",
  //       "ocYxcuBt0mRugKZ7tGAHPnUaOW7Y"  ]
  //   },
  // "next_openid":"ocYxcuBt0mRugKZ7tGAHPnUaOW7Y"//拉取列表最后一个用户的openid
  // }
  async getTagUsers(tagid,next_openid =''){
    try{
      const {access_token} = await this.fetchAccessToken();
      const url = `${api.tag.getUsers}access_token=${access_token}`;
      return await rp({method:'POST',url,json:true,body:{tagid,next_openid}});
    }catch(e){
      return 'getTagUsers方法出错' + e;
    }
  }

  //批量为用户打标签，openid_list粉丝列表，tagid标签id，成功的返回值是{"errcode":0,"errmsg":"ok"}
  async batchTagUsers(openid_list,tagid){
    try{
      const {access_token} = await this.fetchAccessToken();
      const url = `${api.tag.batch}access_token=${access_token}`;
      return await rp({method:'POST',url,json:true,body:{openid_list,tagid}})
    }catch(e){
      return 'batchTagUsers方法出错' + e;
    }
  }

  //根据标签进行群发，将群发的内容作为参数传入
  async sendAllByTag(options){
    try{
      const {access_token} = await this.fetchAccessToken();
      const url = `${api.message.sendall}access_token=${access_token}`;
      return await rp({method:'POST',url, json:true, body:options});
    }catch(e){
      return 'sendAllByTag方法出错' + e;
    }
  }

  //永久素材管理（复用性）（一个方法实现多个功能（功能要类似）），先把接口api整好
  //通过type区分用哪个接口调用，通过material确定上传的内容，body：上传视频素材还需要post另一个表单
  async uploadMaterial (type , material , body){
    try {
      const {access_token} = await this.fetchAccessToken();
      //定义请求地址,上传的东西不一样，请求地址也不一样，需要先根据类型判断用哪种请求地址
      let url = '';
      //请求参数所在地方不同，有的是请求体，有的是form表单的形式，
      //先将请求options定义成对象，具体内容判断后再对应添加
      let options = {method: 'POST' , json : true}

      //根据类型确定请求地址和传请求参数的方式
      if (type === 'news'){
        //返回值是新增的图文消息素材的media_id，
        url = `${api.upload.uploadNews}access_token=${access_token}`;
        //请求体参数
        options.body = material;
      }else if(type === 'pic'){
        //返回值是上传图片的URL，可放置图文消息中使用
        url = `${api.upload.uploadimg}access_token=${access_token}`;
        //请求体以form表单上传
        options.formData = {
          media : createReadStream(material)
        }
      }else{
        //返回值是新增的永久素材的media_id和新增的图片素材的图片URL
        url = `${api.upload.uploadOthers}access_token=${access_token}&type=${type}`;
        //请求体以form表单上传
        options.formData = {
          media: createReadStream(material)
        }
        //如果是视频素材，还需要上传另一个表单
        if (type === 'video'){
          options.body = body;
        }
      }

      options.url = url;
      //发送请求
      return await rp(options);

    }catch(e){
      return 'uploadMaterial方法出错' + e;
    }
  }



}




//读取本地保存的access_token
(async () => {
  //创建类的实例对象，拿到类里面的方法
  const w = new Wechat();

  //测试用户管理，tagid 101
  /*let result1 = await w.createTag('巴拉');
  console.log(result1);
  let result2 = await w.batchTagUsers([
    'oXPka0qZsFmQ9_Han8gdzitP3mB0',
    'oXPka0iC7MOZloi9GIl-cVhmJ4gk'
  ],result1.tag.id);
  console.log(result2);
  let result3 = await w.getTagUsers(result1.tag.id);
  console.log(result3);*/

  //测试群发消息
  /*let result = await w.sendAllByTag({
    "filter":{
    "is_to_all":false,
      "tag_id":101
    },
    "text":{
    "content":"请问你是猪吗"
    },
    "msgtype":"text"
  });
  console.log(result);*/

  //测试素材管理
  //上传图片获取media_id(为什么上传图片有的获取media_id，有的获取地址)
  /*let result1 = await w.uploadMaterial('image', './node.jpg');
  /!*{ media_id: 'nn7DWPi7HUIofgCt5mAEooPuhcbgtDcvJPWpV0Adps4',
   url: 'http://mmbiz.qpic.cn/mmbiz_png/I8atTzMHhbvk62z3QYdy8H5WqR3hzyzubyRy1d2hseyjqqic5wiaxmTF9VxdjJDvwibSDLZyyHpEB9MUHIRrUoHMw/0?wx_fmt=png' }*!/
  console.log(result1);
  //上传图片获取地址(为什么不用上面的方式获取到media_id和url，这里获取的url和上面获取的url有什么区别)
  let result2 = await w.uploadMaterial('pic', './logo.png');
  /!*{ url: 'http://mmbiz.qpic.cn/mmbiz_png/I8atTzMHhbvk62z3QYdy8H5WqR3hzyzucVl5W0XZBzkg2qABWywyhg51XUWdmjVvTv1Wtt1YJKrFoqWNialyMkg/0' }*!/
  console.log(result2);

  //上传图文消息
  let result3 = await w.uploadMaterial('news', {
    //数组里面有几个对象就有几条图文消息
    "articles": [{
      "title": '微信公众号开发',
      "thumb_media_id": result1.media_id,
      "author": '佚名',
      "digest": '这里是class0810开发的',//摘要
      "show_cover_pic": 1,//是否显示封面
      "content": `<!DOCTYPE html>
                  <html lang="en">
                  <head>
                    <meta charset="UTF-8">
                    <title>Title</title>
                  </head>
                  <body>
                    <h1>微信公众号开发</h1>
                    <img src="${result2.url}">
                  </body>
                  </html>`,
      "content_source_url": 'http://www.atguigu.com',//点击阅读全文后跳转的链接
      "need_open_comment":1,
      "only_fans_can_comment":1
    },
      {
        "title": 'class0810',
        "thumb_media_id": result1.media_id,
        "author": '佚名',
        "digest": '课程学了一大半了~马上要毕业了',
        "show_cover_pic": 0,
        "content": '今天天气真晴朗',
        "content_source_url": 'https://www.baidu.com',
        "need_open_comment":0,
        "only_fans_can_comment":0
      }
    ]
  });
  /!*{ media_id: 'nn7DWPi7HUIofgCt5mAEouA35soleX2Nn-XVn21Rsnw' }*!/
  console.log(result3);*/

  //删除菜单，再创建，我的妈呀~~~~~难死我啦~~~~
  let result = await w.deleteMenu();
  console.log(result);
  result = await w.createMenu(require('./menu'));
  console.log(result);



})();

