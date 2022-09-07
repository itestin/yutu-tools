var fs = require('fs-extra')
var path = require('path');
var cp = require('child_process');
var inquirer = require('inquirer');
var npminstall = require('npminstall');
var i18n = require('./i18n');
var co = require('co');

var projectPath = path.resolve(__dirname, '../project');

function getSyncBrowsers(browsers) {
    const obj = [];
    if (browsers){
        const params = browsers.split(',')
        params.map((e, index) => {
            if (e){
                let browserName = e.split(":")[0];
                let version = e.split(":")[1];
                obj.push({
                    id: index, browserName, version
                });
            }
        });
    }
    return obj
}


function initConfig(options){
    var locale = options.locale;
    var mobile = options.mobile;
    var serverIp = options.serverIp;
    var mainClient = getSyncBrowsers(options.mainClient);
    var syncCheckBrowserList = getSyncBrowsers(options.syncBrowsers);
    if(locale){
        i18n.setLocale(locale);
    }
    var configPath = 'config.json';
    var configFile = path.resolve(configPath);
    var config = {};
    if(fs.existsSync(configFile)){
        var content = fs.readFileSync(configFile).toString();
        try{
            config = JSON.parse(content);
        }
        catch(e){}
    }
    var recorder;
    config.webdriver = config.webdriver || {};
    config.vars = config.vars || {};
    config.serverIp = serverIp || '';
    config.reporter = config.reporter || { distDir: '' };
    config.screenshots = config.screenshots || { captureAll: true };
    var webdriver = config.webdriver;
    webdriver.host = webdriver.host || '127.0.0.1';
    webdriver.port = webdriver.port || '4444';
    webdriver.chromeOptions = webdriver.chromeOptions || { w3c: false };
    if(!mobile){
        config.recorder = config.recorder || {};
        recorder = config.recorder;
        recorder.pathAttrs =  recorder.pathAttrs && recorder.pathAttrs !=='undefined' ? recorder.pathAttrs : 'data-id,data-name,type,data-type,role,data-role,data-value';
        recorder.attrValueBlack =  recorder.attrValueBlack && recorder.attrValueBlack !=='undefined' ? recorder.attrValueBlack : '';
        recorder.classValueBlack =  recorder.classValueBlack && recorder.classValueBlack !=='undefined' ? recorder.classValueBlack : '';
        recorder.hideBeforeExpect =  recorder.hideBeforeExpect && recorder.hideBeforeExpect !=='undefined' ? recorder.hideBeforeExpect : '';
        webdriver.browsers = webdriver.browsers && webdriver.browsers !=='undefined' ? webdriver.browsers : 'chrome, ie 11';
        webdriver.mainBrowser = mainClient ? mainClient[0] : {};
        webdriver.syncBrowsers = syncCheckBrowserList || [];
    }
    var questions = [];
    if(mobile && !options.host){
        questions = [
            {
                'type': 'input',
                'name': 'host',
                'message': __('webdriver_host'),
                'default': webdriver.host,
                'filter': function(input){
                    return input.replace(/(^\s+|\s+$)/g, '');
                },
                'validate': function(input){
                    return input !== '' && /^https?:\/\//.test(input) === false;
                }
            },
            {
                'type': 'input',
                'name': 'port',
                'message': __('webdriver_port'),
                'default': webdriver.port,
                'filter': function(input){
                    return input.replace(/(^\s+|\s+$)/g, '');
                },
                'validate': function(input){
                    return input !== '';
                }
            }
        ];
    }
    else if (!options.host){
        questions = [
            {
                'type': 'input',
                'name': 'pathAttrs',
                'message': __('dom_path_config'),
                'default': recorder.pathAttrs,
                'filter': function(input){
                    return input.replace(/(^\s+|\s+$)/g, '');
                }
            },
            {
                'type': 'input',
                'name': 'attrValueBlack',
                'message': __('attr_black_list'),
                'default': recorder.attrValueBlack,
                'filter': function(input){
                    return input.replace(/(^\s+|\s+$)/g, '');
                }
            },
            {
                'type': 'input',
                'name': 'classValueBlack',
                'message': __('class_black_list'),
                'default': recorder.classValueBlack,
                'filter': function(input){
                    return input.replace(/(^\s+|\s+$)/g, '');
                }
            },
            {
                'type': 'input',
                'name': 'hideBeforeExpect',
                'message': __('hide_before_expect'),
                'default': recorder.hideBeforeExpect,
                'filter': function(input){
                    return input.replace(/(^\s+|\s+$)/g, '');
                }
            },
            {
                'type': 'input',
                'name': 'host',
                'message': __('webdriver_host'),
                'default': webdriver.host,
                'filter': function(input){
                    return input.replace(/(^\s+|\s+$)/g, '');
                },
                'validate': function(input){
                    return input !== '' && /^https?:\/\//.test(input) === false;
                }
            },
            {
                'type': 'input',
                'name': 'port',
                'message': __('webdriver_port'),
                'default': webdriver.port,
                'filter': function(input){
                    return input.replace(/(^\s+|\s+$)/g, '');
                },
                'validate': function(input){
                    return input !== '';
                }
            },
            {
                'type': 'input',
                'name': 'browsers',
                'message': __('webdriver_browsers'),
                'default': webdriver.browsers,
                'filter': function(input){
                    return input.replace(/(^\s+|\s+$)/g, '');
                },
                'validate': function(input){
                    return input !== '';
                }
            }
        ];
    }
    inquirer.prompt(questions).then(function(anwsers){
        webdriver.host = options.host || String(anwsers.host || '').replace(/^\s+|\s+$/g, '');
        webdriver.port = options.port ||  String(anwsers.port || '').replace(/^\s+|\s+$/g, '');
        if(!mobile){
            recorder.pathAttrs = recorder.pathAttrs || String(anwsers.pathAttrs || '').replace(/^\s+|\s+$/g, '');
            recorder.attrValueBlack = recorder.attrValueBlack || String(anwsers.attrValueBlack || '').replace(/^\s+|\s+$/g, '');
            recorder.classValueBlack = recorder.classValueBlack || String(anwsers.classValueBlack || '').replace(/^\s+|\s+$/g, '');
            recorder.hideBeforeExpect = recorder.hideBeforeExpect || String(anwsers.hideBeforeExpect || '').replace(/^\s+|\s+$/g, '');
            webdriver.browsers = String(anwsers.browsers || '').replace(/^\s+|\s+$/g, '');
        }
        fs.writeFileSync(configFile, JSON.stringify(config, null, 4));
        console.log('');
        console.log(configPath.bold+' '+__('file_saved').green);
        if(mobile){
            initProject({
                'package.json':'',
                // 'README.md':'',
                'screenshots':'',
                'diffbase':'',
                'commons':'',
                '.editorconfig':'',
                // '.gitignore1':'.gitignore',
                'install.sh':'',
                'run.bat':'',
                'run.sh':'',
                // 'vslaunch.json':'.vscode/launch.json'
            });
        }
        else{
            var hostsPath = 'hosts';
            initProject({
                'package.json':'',
                // 'README.md':'',
                'screenshots':'',
                'diffbase':'',
                'commons':'',
                'uploadfiles':'',
                '.editorconfig':'',
                // '.gitignore1':'.gitignore',
                'install.sh':'',
                'run.bat':'',
                'run.sh':'',
                // 'hosts': hostsPath,
                // 'vslaunch.json':'.vscode/launch.json'
            });
        }
        // co(function* () {
        //     console.log('');
        //     console.log('Start install project dependencies...'.cyan);
        //     console.log('--------------------------------------------');
        //     console.log('');
        //     var npminstallOptions = {
        //         root: process.cwd(),
        //         registry: 'https://registry.npm.taobao.org'
        //     };
        //     var proxy;
        //     try{
        //         var cnpmout = cp.execSync('cnpm config get proxy', {stdio:['pipe', 'pipe', 'ignore']});
        //         cnpmout = cnpmout.toString().trim();
        //         if(/^http:\/\//.test(cnpmout)){
        //             proxy = cnpmout;
        //         }
        //     }
        //     catch(e){}
        //     if(proxy){
        //         npminstallOptions.proxy = proxy;
        //         console.log('Find proxy from cnpm:', proxy);
        //     }
        //     yield npminstall(npminstallOptions);
        //     if(!mobile && webdriver.host === '127.0.0.1'){
        //         console.log('');
        //         console.log('Start install webdriver dependencies...'.cyan);
        //         console.log('--------------------------------------------');
        //         console.log('');
        //         var installdriver = cp.exec('npm run installdriver');
        //         installdriver.stdout.on('data', function(data){
        //             console.log(data);
        //         });
        //     }
        // });
        process.exit();
    }).catch(function(err){
        console.log(err)
        process.exit();
    });
}

function initProject(mapFiles){
    for(var key in mapFiles){
        initProjectFileOrDir(key, mapFiles[key]);
    }
}

function initProjectFileOrDir(srcName, descName){
    descName = descName || srcName;
    var srcFile = projectPath + '/' + srcName;
    var destFile = path.resolve(descName);
    if(fs.existsSync(destFile) === false){
        fs.copySync(srcFile, destFile);
        console.log(descName.bold+' '+__(fs.statSync(srcFile).isDirectory()?'dir_created':'file_created').green);
    }
}

module.exports = initConfig;
