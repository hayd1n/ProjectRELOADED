/*
 *   Copyright (c) 2021 CRT_HAO 張皓鈞
 *   All rights reserved.
 *   CISH Robotics Team
 */

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});

const OS = require("os");

function getSystemVersionSafe() {
  // getSystemVersion only exists when running under Electron, and not when
  // running unit tests which frequently end up calling this. There are no
  // other known reasons why getSystemVersion() would return anything other
  // than a string
  return 'getSystemVersion' in process ? process.getSystemVersion() : undefined;
}

function systemVersionGreaterThanOrEqualTo(version) {
  const sysver = getSystemVersionSafe();
  return sysver === undefined ? false : compare(sysver, version, '>=');
}

function getSystemVersionSafe() {
  // getSystemVersion only exists when running under Electron, and not when
  // running unit tests which frequently end up calling this. There are no
  // other known reasons why getSystemVersion() would return anything other
  // than a string
  return 'getSystemVersion' in process ? process.getSystemVersion() : undefined;
}

function systemVersionGreaterThanOrEqualTo(version) {
  const sysver = getSystemVersionSafe();
  return sysver === undefined ? false : compare(sysver, version, '>=');
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
const isMacOsAndMojaveOrLater = () => __DARWIN__ && systemVersionGreaterThanOrEqualTo('10.13.0');

/** We're currently running macOS and it is at least Big Sur. */
const isMacOSBigSurOrLater = () => __DARWIN__ && systemVersionGreaterThanOrEqualTo('11.0.0');

/** We're currently running Windows 10 and it is at least 1809 Preview Build 17666. */
const isWindows10And1809Preview17666OrLater = () => __WIN32__ && systemVersionGreaterThanOrEqualTo('10.0.17666');

console.log(getOS());