/**
 * Created by Administrator on 2018/11/17 0017.
 */
/*
* 通过判断用户发送的消息类型，设置具体响应的内容*/

//需要传参，要暴露一个方法
module.exports = message => {
  //初始化一个消息配置对象
  let options = {
    toUserName:message.FromUserName,
    fromUserName:message.ToUserName,
    createTime:Date.now(),
    msgType:'text'
  };

  //初始化一个消息文本
  let content = '你说啥，听不懂';

  //判断消息的类型：文本、语音、位置、事件
  if (message.MsgType === 'text'){
    //根据文本的具体内容，响应对应的消息
    if (message.Content === '1'){
      content = '大吉大利，今晚吃鸡';
    }else if (message.Content === '2'){
      content = '躺鸡';
    }else if (message.Content.includes('游戏')){
      content = '阴阳师绝地王者'
    }else if (message.Content === '4'){
      options.msgType = 'news';
      options.title = '微信公众号开发~';
      options.description = 'class0810~';
      options.picUrl = 'https://ss1.baidu.com/6ONXsjip0QIZ8tyhnq/it/u=199783060,2774173244&fm=58&s=188FA15AB1206D1108400056000040F6&bpow=121&bpoh=75';
      options.url = 'http://www.atguigu.com';
    }
  }else if (message.MsgType === 'voice'){
    //用户发送的是语音
    content = `语音识别的结果为：${message.Recognition}`;
  }else if (message.MsgType === 'location'){
    //用户主动发送地理位置
    content = `维度：${message.Location_X} 经度：${message.Location_Y} 地图的缩放：${message.Scale} 位置详情：${message.label}`;

  }else if (message.MsgType === 'event'){
    //接收的是用户的事件推送
    //判断用户触发的是那种事件
    if (message.Event === 'subscribe'){
      //关注/订阅
      content = '欢迎您的关注';
      //如果有EventKey，说明是扫二维码关注的
      if (message.EventKey){
        content = '欢迎您关注公众号~, 扫了带参数的二维码';
      }
    }else if (message.Event === 'unsubscribe'){
      //说明取消关注了
    }else if (message.Event === 'LOCATION'){
      //用户初次访问时自动获取用户的地理位置
      content = `纬度：${message.Latitude} 经度：${message.Longitude}`;
    }else if (message.Event === 'CLICK'){
      content = `用户点击了：${message.EventKey}`;
    }
  }
  //content用来回复文本类型的消息
  options.content = content;
  //将回复的内容返出去
  return options;
}