/**
 * Created by Administrator on 2018/11/16 0016.
 */
//引入xml2js
const {parseString} = require('xml2js');

//暴露出去一个对象
module.exports = {

  //调用获取用户消息的函数，让返回值是promise对象
  getUserDataAsync (req) {
    return new Promise((resolve) => {
      //定义一个变量接收数据
      let result = '';
      //给req绑定data、end事件，用来获取微信服务器转发的用户消息
      req
      .on('data',data => {
        //接收到的data是buffer类型的数据，要进行toString()转换
        result += data.toString();
      })
        //end事件监听数据有没有接受完，成功之后将数据作为参数传到服务器端
      .on('end',() => {
        resolve(result);
      })
    })
  },

  //调用将xml数据转成js对象的函数，让返回值是promise对象
  //需要从npm下载一个第三方模块
  parseXMLDataAsync(xmlData){
    return new Promise((resolve,reject) => {
      //{trim：true}是去除空格
      parseString(xmlData,{trim:true},(err,data) => {
        //如果没有错（成功）就将数据作为参数传到服务器端
        if (!err){
          resolve(data);
        }else{
          reject('parseXMLDataAsync方法出了问题'+err);
        }
      })
    })
  },

  //格式化数据
  formatMessage({xml}){
    //去掉外层的xml，通过用解构赋值的方式传参就可以去掉外层的xml
    //再去掉[],通过用for..in..遍历对象去掉[]
    //重新定义一个对象，不要改变原来的数据
    let result = {};
    for (let key in xml){
      //获取属性值，此时拿到的value是数组
      let value = xml[key];
      //将数据添加到result中,value[0]拿到数组中的值，添加到定义的result对象中
      result[key] = value[0];
    }
    //将格式化完的数据返出去
    return result;
  }


}