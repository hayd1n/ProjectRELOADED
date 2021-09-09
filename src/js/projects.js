/*
 *   Copyright (c) 2021 CRT_HAO 張皓鈞
 *   All rights reserved.
 *   CISH Robotics Team
 */

var Store = require('@electron/remote').require('electron-store');
var os = require('os');
var fs = require('fs');
var path = require('path');
var JSZip = require("jszip");
var StreamZip = require('node-stream-zip');
var AdmZip = require('adm-zip');
var pm = require('picomatch');
var { v4: uuidv4 } = require('uuid');
var syncforeach = require('@electron/remote').require('sync-foreach');
var rimraf = require("rimraf");

const store = new Store();


function readProject(projectPath) {
    console.log("讀取專案配置", path.join(projectPath, "/.projectRELOADED/project.json"));
    try {
        data = JSON.parse(fs.readFileSync(path.join(projectPath, "/.projectRELOADED/project.json")));
    }catch(e){
        console.log("專案讀取錯誤！" + e);
        return null;
    }
    return data;
}

function isProjectDataInvalid(projectData) {
    valid = projectData.uuid != undefined && projectData.name != undefined ? true : false;
    return valid;
}

function loadProjects(callback) {
    let projects = [];
    projectsPath = readProjectsPath();
    syncforeach(projectsPath, (next, projectPath) => {
        const projectData = readProject(projectPath);
        let project = projectData ? projectData : {};
        project.path = projectPath;
        project.invalid = projectData ? true : false;
        if(projectData) {
            getProjectLatestBackupDate(project, (lastBackup) => {
                project.lastBackup = lastBackup;
                if(isProjectDataInvalid(projectData)) projects.push(project);
                next();
            });
        }else{
            projects.push(project);
            next();
        }
    }).done(() => {
        if(callback) {
            callback(projects);
        }
    });
}

function addProject(projectPath, callback) {
    if(fs.existsSync(path.join(projectPath, "/.projectRELOADED/project.json"))) {
        console.log("發現projectRELOADED配置文件" + projectPath);
        if(!readProjectsPath().includes(projectPath)) {
            addProjectPath(projectPath);
        }
    }else{
        createProjectDialog(projectPath);
    }
    if(callback) callback();
}

function createProject(projectPath, name, callback) {
    data = {
        uuid: uuidv4(),
        name: name,
        createDate: Date.now(),
        creator: {
            username: os.userInfo().username,
            hostname: os.hostname(),
            platform: process.platform,
            systemVerstion: process.getSystemVersion()
        }
    };
    fs.mkdir(path.join(projectPath, "/.projectRELOADED"), (err) => { 
        if (err) { 
            throw err;
        } 
        fs.mkdir(path.join(projectPath, "/.projectRELOADED/backups"), (err) => { 
            if (err) { 
                throw err;
            } 
            fs.writeFile(path.join(projectPath, "/.projectRELOADED/project.json"), JSON.stringify(data), (err) => {
                if (err) {
                    throw err;
                }
                addProject(projectPath, () => {
                    if(callback) callback();
                });
            });
        });
    });
}

function readFileList(path, onRead, onDone) {
    files_list = [];
    syncforeach(fs.readdirSync(path), (next, file)=>{
        files_list.push(file);
        if(onRead) onRead(file);
        next();
    }).done(() => {
        if(onDone) onDone();
    });
    return files_list;
}

function readProjectFiles(projectPath, onRead) {
    console.log("讀取目錄" + projectPath);
    const ignore_list = readProjectIgnoreList(projectPath);
    files_list = [];
    fs.readdirSync(projectPath).forEach((file)=>{
        if(file != ".projectRELOADED") {
            var pathname = path.join(projectPath, file);
            files_list.push({
                name: file,
                folder: fs.statSync(pathname).isDirectory(),
                path: pathname,
                ignore: pm.isMatch(file, ignore_list)
            });
            if(onRead) onRead(pathname);
        }
    });
    return files_list;
}

function readProjectIgnoreList(projectPath) {
    let ignore_list = [];
    try {
        // read contents of the file
        const data = fs.readFileSync(path.join(projectPath, ".ignore"), 'UTF-8');

        // split the contents by new line
        const lines = data.split(/\r?\n/);

        // print all lines
        lines.forEach((line) => {
            if(line != '' && line.indexOf('#') != 0) ignore_list.push(line);
        });
    } catch (err) {
        console.log(".ignore讀取失敗");
        return [];
    }
    return ignore_list;
}

function readProjectToZip(projectPath, zip, hiddenProjectInfo=true) {
    const ignore_list = readProjectIgnoreList(projectPath);
    if(hiddenProjectInfo) ignore_list.push('.projectRELOADED');
    function readFullDirToZip(zip, dirPath) {
        // 讀取dist下的根檔案目錄
        const files = fs.readdirSync(dirPath); 
        files.forEach(fileName => {
            const filePath = path.join(dirPath, fileName);
            const file = fs.statSync(filePath);
            const relative_path = filePath.replace(projectPath + "/", "");
            // 檔案不在.ignore裡才加入
            if(!pm.isMatch(relative_path, ignore_list)) {
                console.log(relative_path);
                // 如果是資料夾的話需要遞迴遍歷下面的子檔案
                if (file.isDirectory()) {
                    const dirZip = zip.folder(fileName);
                    readFullDirToZip(dirZip, filePath);
                } else {
                    // 讀取每個檔案為buffer存到zip中
                    zip.file(fileName, fs.readFileSync(filePath));
                }
            }
        });
    }
    readFullDirToZip(zip, projectPath);
}

function backupProject(projectPath, name, success, type=0) {
    console.log("備份專案目錄" + projectPath);
    const backupFilename = Date.now().toString() + ".pjrlb";
    const backupPath = path.join(projectPath, "/.projectRELOADED/backups/");
    const backupFullPath = path.join(backupPath, backupFilename);
    fs.promises.mkdir(backupPath, { recursive: true }).catch(console.error);
    var zip = new JSZip();
    readProjectToZip(projectPath, zip);
    const backupInfo = {
        uuid: uuidv4(),
        name: name,
        time: Date.now(),
        type: type,
        creator: {
            username: os.userInfo().username,
            hostname: os.hostname(),
            platform: process.platform,
            systemVerstion: process.getSystemVersion()
        }
    };
    zip.file("backup.json", new TextEncoder("utf-8").encode(JSON.stringify(backupInfo)));

    zip
    .generateNodeStream({type:'nodebuffer',streamFiles:true})
    .pipe(fs.createWriteStream(backupFullPath, { flag: 'wx' }))
    .on('finish', function () {
        console.log("專案已備份！" + backupFullPath);
        if(success) success();
    });
}

function readBackupInfo(backupFile, callback) {
    try {
        const zip = new StreamZip({ file: backupFile });
        zip.on('ready', () => {
            const entry = zip.entryDataSync('backup.json');
            const projectInfo = JSON.parse(entry);
            projectInfo.time = new Date(projectInfo.time);
            projectInfo.filename = backupFile;
            if(callback) callback(projectInfo);
            zip.close();
        });
    } catch(e) {
        console.log(e);
    }
}

function readProjectAllBackupsInfo(projectPath, callback) {
    let backups = [];
    const backupsPath = path.join(projectPath, "/.projectRELOADED/backups");
    const files = fs.readdirSync(backupsPath);
    files.forEach( (fileName, index) => {
        const filePath = path.join(backupsPath, fileName);
        const file = fs.statSync(filePath);
        if(!file.isDirectory()) {
            readBackupInfo(filePath, (backupInfo) => {
                const index = backups.push(backupInfo) - 1;
                backups[index].filename = fileName;
                if(index === files.length-1 && callback) callback(backups);
            });
        }
    });
    if(files.length == 0 && callback) callback(backups);
}

function restoreProjectBackup(project, backupFileName, callback) {
    const backupFile = path.join(project.path, "/.projectRELOADED/backups/", backupFileName);
    readBackupInfo(backupFile, (data) => {
        if(true) {
        // if(data.type != 2) {
            backupProject(project.path, "還原到「" + data.name + "」的自動備份", () => {
                restore();
            }, type=2);
        }else{
            restore();
        }
        function restore() {
            function deleteAllProjectFiles(projectPath, callback) {
                readFileList(projectPath, (filename) => {
                    if(filename != ".projectRELOADED") {
                        const filePath = path.join(projectPath, filename);
                        const file = fs.statSync(filePath);
                        if(file.isDirectory()) {
                            deleteAllProjectFiles(path.join(projectPath, filename));
                        }else{
                            fs.unlinkSync(filePath);
                        }
                    }
                }, () => {
                    if(callback) callback();
                });
            }
            deleteAllProjectFiles(project.path, () => {
                const zip = new AdmZip(backupFile);
                zip.extractAllTo(project.path, true);
                try {
                    fs.unlinkSync(path.join(project.path, "backup.json"));
                }catch(e){}
                if(callback) callback();
            });
        }
    });
}

function deleteProjectBackupFile(project, filename, callback) {
    rimraf.sync(path.join(project.path, "/.projectRELOADED/backups/", filename));
    if(callback) callback();
}

function getProjectLatestBackupDate(project, callback) {
    readProjectAllBackupsInfo(project.path, (data) => {
        sortByTime = data.sort((first, second) => {
            return second.time - first.time;
        });
        latestTime = sortByTime.length > 0 ? sortByTime[0].time : 0;
        if(callback) callback(latestTime);
    });
}

function readProjectReadmeFile(project) {
    let data = "";
    try {
        data = fs.readFileSync(path.join(project.path, "README.md"), 'utf8');
    }catch(e) {
        return null;
    }
    return data;
}

function deleteProject(project, callback, deleteConfig=false) {
    if(deleteConfig) rimraf.sync(path.join(project.path, "/.projectRELOADED/"));
    removeProjectPath(project.path);
    if(callback) callback();
}

function readProjectsPath() {
    if(!store.has('projectsPath')) {
        store.set('projectsPath', []);
    }
    return store.get('projectsPath');
}

function writeProjectsPath(projectsPath) {
    return store.set('projectsPath', projectsPath);
}

function addProjectPath(projectPath) {
    let projectsPath = readProjectsPath();
    projectsPath.push(projectPath);
    writeProjectsPath(projectsPath);
}

function removeProjectPath(projectPath) {
    let projectsPath = readProjectsPath();
    const index = projectsPath.indexOf(projectPath);
    if (index > -1) {
        projectsPath.splice(index, 1);
    }
    writeProjectsPath(projectsPath);
}