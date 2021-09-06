/*
 *   Copyright (c) 2021 CRT_HAO 張皓鈞
 *   All rights reserved.
 *   CISH Robotics Team
 */

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const OS = require("os");

function getSystemVersionSafe() {
  // getSystemVersion only exists when running under Electron, and not when
  // running unit tests which frequently end up calling this. There are no
  // other known reasons why getSystemVersion() would return anything other
  // than a string
  return 'getSystemVersion' in process ? process.getSystemVersion() : undefined;
}

/** Get the OS we're currently running on. */
function getOS() {
  if (process.platform == 'darwin') {
    return `Mac OS ${getSystemVersionSafe()}`;
  } else if (process.platform == 'win32') {
    return `Windows ${OS.release()}`;
  } else {
    return `${OS.type()} ${OS.release()}`;
  }
}

/** We're currently running macOS and it is at least Mojave. */
const isMacOsAndMojaveOrLater = function() {
  return (process.platform == 'darwin') ? getSystemVersionSafe() >= '10.13.0' : false;
};

/** We're currently running macOS and it is at least Big Sur. */
const isMacOSBigSurOrLater = function() {
  return (process.platform == 'darwin') ? getSystemVersionSafe() >= '11.0.0' : false;
};

/** We're currently running Windows 10 and it is at least 1809 Preview Build 17666. */
const isWindows10And1809Preview17666OrLater = function() {
  return (process.platform == 'win32') ? getSystemVersionSafe() >= '10.0.17666' : false;
};

window.addEventListener('DOMContentLoaded', () => {
  init();
});

function init() {

  if(isMacOsAndMojaveOrLater()) {
    document.getElementById("titlebar").classList.add("titlebar-macos-mojave-or-later");
    document.getElementById("appbar").classList.add("appbar-with-titlebar-macos-mojave-or-later");
    document.body.classList.add("body-with-titlebar-macos-mojave-or-later");
  }else if(isMacOSBigSurOrLater()) {
    document.getElementById("titlebar").classList.add("titlebar-macos-bigsur-or-later");
    document.getElementById("appbar").classList.add("appbar-with-titlebar-macos-bigsur-or-later");
    document.body.classList.add("body-with-titlebar-macos-bigsur-or-later");
  }else if(isWindows10And1809Preview17666OrLater) {
    document.getElementById("titlebar").classList.add("titlebar-win10");
    document.getElementById("appbar").classList.add("appbar-with-titlebar-win10");
    document.body.classList.add("body-with-titlebar-win10");
  }

}