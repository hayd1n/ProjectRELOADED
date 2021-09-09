const path = require('path');
const builder = require('electron-builder');

builder.build({
    projectDir: path.resolve(__dirname),

    win: ['nsis'],
    config: {
        "appId": "com.crt_hao.projectreloaded",
        "productName": "ProjectRELOADED",
        "directories": {
            "output": "build/win32"
        },
        "win": {
            "icon": path.resolve(__dirname, 'assets/Icon-1024.png'),
        },
        "mac": {
            "target": "dmg",
            "icon": path.resolve(__dirname, 'assets/Icon-1024.png'),
        }
    },
})
    .then(
        data => console.log(data),
        err => console.error(err)
    );