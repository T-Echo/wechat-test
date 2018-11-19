/**
 * Created by Administrator on 2018/11/17 0017.
 */
const rp = require('request-promise-native');
const {writeFile,readFile} = require('fs');
const {appID,appsecret} = require('../config');
const api = require('../api');
const {writeFileAsync,readFileAsync} = require('../utils/tools-2');

//定义一个类，用来获取、读取、保存、判断是否过期 access_token、ticket、菜单
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

  //创建标签
  async createTag(name){
    try{
      const {access_token} = await this.fetchAccessToken();
      const url = `${api.tag.create}access_token=${access_token}`;
      return await rp({method:'POST',url,json:true,body:{"tag":{name}}});
    }catch(e){
      return 'createTag方法出错' + e;
    }
  }
  //获取标签下粉丝列表
  async getTagUsers(tagid,next_openid = ''){
    try{
      const {access_token} = await this.fetchAccessToken();
      const url = `${api.tag.getUsers}access_token=${access_token}`;
      return await rp({method:'POST',url,json:true,body:{tagid,next_openid}});
    }catch(e){
      return 'getTagUsers方法出错' + e;
    }
  }

  //批量为用户打标签
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

  //绑定SDK
  //获取ticket
  async getTicket(){
    //获取access_token
    const {access_token} = await this.fetchAccessToken();

    const url = `${api.ticket}access_token=${access_token}`;

    const result = await rp({method: 'GET', url ,json: true});
    return {
      ticket : result.ticket,
      ticket_expires_in : Date.now() + 7200000 - 300000
    }
  }

  //保存ticket
  saveTicket(filePath,ticket){
    return writeFileAsync(filePath,ticket);
  }

  //读取有效的ticket
  readTicket(filePath){
    return readFileAsync(filePath);
  }

  //判断ticket是否过期
  isValidTicket({ticket_expires_in}){
    //三元表达式简写，条件成立（没过期）返回true，条件不成立（过期）返回false
    return Date.now() < ticket_expires_in;
  }


  //获取有效ticket的方法，为什么返回值必须是promise对象？
  fetchTicket(){
    //第二次会进来这个判断，判断实例对象上有没有ticket和ticket_expires_in，
    //并且判断是不是有效，如果有并且有效就返回有效的ticket
    if (this.ticket && this.ticket_expires_in && this.isValidTicket(this)){
      //实例对象有很多其他属性方法，这里只用到ticket和ticket_expires_in，所以返回值用对象的方式，并包装成promise对象
      return Promise.resolve({ticket:this.ticket,ticket_expires_in:this.ticket_expires_in});
    }

    //调用读取ticket的函数,因为是分两种情况，用async..await..麻烦，这里用.then().catch()
    //返回值是promise对象，所以可以.then()，.then()、.catch()的返回值是内部函数的返回值
    return this.readTicket('./ticket.txt')
    //如果有保存的ticket,判断有没有过期
      .then(async res => {
        if (this.isValidTicket(res)){
          console.log(res);
          //没过期，直接使用
          console.log('没有过期，直接使用');
          //return的res包着promise
          return res;
        }else{
          //过期了,重新获取并保存
          const ticket = await this.getTicket();
          await this.saveTicket('./ticket.txt',ticket);
          //return的ticket包着promise
          return ticket;
        }
      })
      //如果没有ticket,就调用getTicket获取ticket，然后调用saveTicket保存
      .catch(async err => {
        const ticket = await this.getTicket();
        await this.saveTicket('./ticket.txt',ticket);
        //return的ticket包着promise
        return ticket;
      })
      .then(res => {
        //不管成功还是失败都会进来这里，将ticket和ticket_expires_in添加到实例对象的属性上
        this.ticket = res.ticket;
        this.ticket_expies_in = res.ticket_expires_in;
        //返回值需要包着promise，可以在函数前加上async，这样返回值包着promise，
        //也可以用Promise的resolve方法将返回值包装成promise对象，并且是成功的状态
        return Promise.resolve(res);
      })
  }





}

//读取本地保存的access_token
(async () => {
  //创建类的实例对象，拿到类里面的方法
  const w = new Wechat();


})();

module.exports = Wechat;

