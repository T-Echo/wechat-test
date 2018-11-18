/*
  设置最终回复给微信服务器的消息模板
 */
/*
*设置最终给微信服务器的消息模板 */

module.exports = (options) => {
  //将消息文本转成xml格式
  let replayMessgae = `<xml>
        <ToUserName><![CDATA[${options.toUserName}]]></ToUserName>
        <FromUserName><![CDATA[${options.fromUserName}]]></FromUserName>
        <CreateTime>${options.createTime}</CreateTime>
        <MsgType><![CDATA[${options.msgType}]]></MsgType>`
  //判断消息的类型
  if (options.msgType === 'test'){
    replayMessgae += `<Content><![CDATA[${options.content}]]></Content>`;
  }else if (options.msgType === 'image'){
    replayMessgae += `<Image><MediaId><![CDATA[${options.mediaId}]]></MediaId></Image>`;
  }else if (options.msgType === 'voice'){
    replayMessgae += `<Voice><MediaId><![CDATA[${options.mediaId}]]></MediaId></Voice>`;
  }else if (options.msgType === 'video'){
    replayMessgae += `<Video>
      <MediaId><![CDATA[${options.mediaId}]]></MediaId>
      <Title><![CDATA[${options.title}]]></Title>
      <Description><![CDATA[${options.description}]]></Description>
      </Video>`;
  }else if (options.msgType === 'music'){
    replayMessgae += `<Music>
      <Title><![CDATA[${options.title}]]></Title>
      <Description><![CDATA[${options.description}]]></Description>
      <MusicUrl><![CDATA[${options.musicUrl}]]></MusicUrl>
      <HQMusicUrl><![CDATA[${options.hqMusicUrl}]]></HQMusicUrl>
      <ThumbMediaId><![CDATA[${options.mediaId}]]></ThumbMediaId>
      </Music>`;
  }else if (option.msgType === 'news'){
    `<ArticleCount>1</ArticleCount>
      <Articles>
      <item>
      <Title><![CDATA[${options.title}]]></Title>
      <Description><![CDATA[${options.description}]]></Description>
      <PicUrl><![CDATA[${options.picUrl}]]></PicUrl>
      <Url><![CDATA[${options.url}]]></Url>
      </item>
      </Articles>`;
  }
  replayMessgae += `<xml>`;
  return replayMessgae;
}

