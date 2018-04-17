var fs = require('fs');
var archiver = require('archiver');
var zipper = require('zip-local');

// function createDir(rename, res) {
//   fs.mkdir('./mkdir/' + rename, function (err) {
//     if (err) {
//       res.send({
//         code: -1,
//         msg: '创建文件夹失败'
//       }).end();
//     } else {
//       res.send({
//         code: 0,
//         msg: '创建文件夹成功',
//         name: rename
//       }).end();
//       keepDirNum('./mkdir', 5);
//       createZip(rename);
//       keepDirNum('zip', 5);
//     }
//   });
// }

// 创建压缩包
function createZip(rename, callback) {
  // 保存信息
  var obj = {};
  zipper.sync.zip('./mkdir/' + rename + '').compress().save('./zip/' + rename + '.zip');
  obj.code = 1;
  obj.success = '压缩成功';
  // obj.size = archive.pointer();
  callback(obj);
  // var archive = archiver('zip');
  // //压缩包的目录
  // archive.directory('./mkdir/' + rename + '');
  // var output = fs.createWriteStream('./zip/' + rename + '.zip');
  // output.on('close', function () {
  //   obj.code = 1;
  //   obj.success = '压缩成功';
  //   obj.size = archive.pointer();
  //   callback(obj);
  // });
  // archive.pipe(output);
  // //压缩包的完成
  // archive.finalize();
  // archive.on('error', function (err) {
  //   obj.error = '压缩失败!';
  // });
}
//保持mkdir文件夹只有n个文件夹
function keepDirNum(catalog, n) {
  var array = [];
  fs.readdirSync(catalog).forEach(function (file, index) {
    var states = fs.statSync(catalog + '/' + file);
    array.push({
      name: file,
      ctime: states.ctime
    });
  });
  //根据创建时间从大到小排序
  array.sort(function (a, b) {
    return b.ctime - a.ctime;
  });
  array = array.slice(n);
  for (var i = 0; i < array.length; i++) {
    if (catalog == 'zip') {
      fs.unlinkSync(catalog + '/' + array[i].name);
    } else {
      deleteDir(catalog + '/' + array[i].name);
    }
  }
}

// 删除文件夹
function deleteDir(path) {
  if (fs.existsSync(path)) {
    var files = fs.readdirSync(path);
    files.forEach(function (file, index) {
      var curPath = path + '/' + file;
      if (fs.statSync(curPath).isDirectory()) {
        deleteDir(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    })
    fs.rmdirSync(path);
  }
}

module.exports = {
  keepDirNum: keepDirNum,
  createZip: createZip
}