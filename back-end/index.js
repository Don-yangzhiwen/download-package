var request = require('request');
var fs = require('fs');
var express = require('express');
var server = express();
var archiver = require('archiver');
var dir = require('./dir.js');
server.listen(3000, function (res) {
  console.log('服务已开启');
});
//开始的查看参数
var pn = 30;
//总共查到的条数
var n = 1;
//关键字
var key = '城市';
//转码
var keyword = encodeURIComponent(key);
var num = 30;
// 状态信息保存
var statusMsg = {};

server.use('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

server.use('/search', function (req, res) {
  n = 1;
  pn = 30;
  var data = req.query;
  keyword = encodeURIComponent(data.keyword);
  num = +data.num > 0 ? +data.num : 30;

  box(function (infor) {
    res.send(infor).end();
  });
});

server.use('/download', function (req, res) {
  var path = './zip/' + req.query.zipname + '.zip';
  res.download(path);
});

function box(callback) {
  deletes('images');
  var rename = Math.round(Math.random() * 1000000);
  //创建文件夹
  fs.mkdir('./mkdir/' + rename, function (err) {
    if (err) {
      statusMsg.createDir = {
        code: -1,
        msg: '创建文件夹失败'
      }
    } else {
      statusMsg.createDir = {
        code: 0,
        msg: '创建文件夹成功',
        name: rename
      }
      startRequest(callback, rename);
    }
  });
};

function startRequest(callback, rename) {
  //百度地址
  var url = 'https://image.baidu.com/search/acjson?tn=resultjson_com&ipn=rj&ct=201326592&is=&fp=result&queryWord=' + keyword + '&cl=2&lm=-1&ie=utf-8&oe=utf-8&adpicid=&st=-1&z=&ic=0&word=' + keyword + '&s=&se=&tab=&width=&height=&face=0&istype=2&qc=&nc=1&fr=&pn=' + pn + '&rn=30';
  var obj = {
    url: url,
    method: 'get'
  };
  request(obj, function (err, res, body) {
    var body = JSON.parse(body);
    statusMsg.data = body.data;
    saveData(body);
    saveImage(body.data, callback, rename);
    if (pn < 30 * Math.ceil(num / 30)) {
      pn += 30;
      startRequest(callback, rename);
    }
    statusMsg.num = num;
  });
}
//写入json数据
function saveData(data) {
  fs.writeFile('upload/data.json', JSON.stringify(data, null, '\t'), function (err) {
    if (err) {
      statusMsg.saveData = '写入失败~!';
    } else {
      statusMsg.saveData = '写入成功~!';
    }
  });
}
//保存图片
function saveImage(data, callback, rename) {
  for (var i = 0; i < data.length - 1; i++) {
    //正则匹配标题的正确
    var reg = /[\u4e00-\u9fa5\w]+/g;
    var a = data[i].fromPageTitleEnc.match(reg);
    var str = a.join('');
    var img_title = str + '-' + data[i].di + '.' + data[i].type;
    var img_src = data[i].middleURL;
    var wstream = fs.createWriteStream('./mkdir/' + rename + '/' + img_title);
    request(img_src).pipe(wstream);
    n++;
    if (n > num) {
      statusMsg.saveImage = {
        code: 200,
        msg: '保存完成'
      }
      wstream.on('finish', () => {
        dir.createZip(rename, function (data) {
          statusMsg.zipInfo = data;
          callback(statusMsg);
        });
        dir.keepDirNum('./mkdir', 5);
        dir.keepDirNum('zip', 5);
      });
      return false;
    }
  };
};
//删除文件
function deletes(path) {
  //读取文件夹下的文件
  var files = fs.readdirSync(path);
  files.forEach(function (file, index) {
    var curpath = path + '/' + file;
    //删除文件夹下的文件
    fs.unlinkSync(curpath);
  });
}