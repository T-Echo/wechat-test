/**
 * Created by Administrator on 2018/11/19 0019.
 */
/*定义接口模块*/

const prefix = `https://api.weixin.qq.com/cgi-bin/`;

module.exports = {
  accessToken:`${prefix}token?grant_type=client_credential&`,
  menu:{
    create:`${prefix}menu/create?`,
    delete:`${prefix}menu/delete?`
  },
  tag:{
    create:`${prefix}tags/create?`,
    getUsers:`${prefix}user/tag/get?`,
    batch:`${prefix}tags/members/batchtagging?`
  },
  //群发消息
  message:{
    sendall:`${prefix}message/mass/sendall?`
  },
  //素材管理
  upload:{
    uploadNews: `${prefix}material/add_news?`,
    uploadimg: `${prefix}media/uploadimg?`,
    uploadOthers: `${prefix}material/add_material?`
  }
}