import store from 'store';
import axios from 'axios';
import config from '../config';

window.axios = axios;
window.store = store;
// CREDITS: http://www.gethugames.in/2012/04/authentication-and-authorization-for-google-apis-in-javascript-popup-window-tutorial.html
// credits: http://www.netlobo.com/url_query_string_javascript.html
function gup(url, name, win, callback) {
  // const n = name.replace(/[[]/, '[').replace(/[]]/, ']');
  const regexS = `[?&]${name}=([^&#]*)`;
  const regex = new RegExp(regexS);
  const results = regex.exec(url);
  if (results != null) {
    win.close();
    callback(results[1]);
  }
  return '';
}

function authenticateAgainstServer(code, callback) {
  // console.log('authenticating against server');
  let authUrl = null;
  if (window.location.hostname === 'localhost') {
    authUrl = config.authUrl;
  } else {
    authUrl = config.prodAuthUrl;
  }
  const url = `${authUrl}/?code=${code}`;
  axios.get(url).then((resp) => {
    store.set('token', resp.data.github_token);
    store.set('api_key', resp.data.api_key);
    callback(resp.data.token, null);
  }).catch((e) => {
    callback(null, e);
    store.clearAll();
  });
}

function getGithubCode(_url, REDIRECT, callback) {
  const win = window.open(_url, 'windowname1', 'width=800, height=600');

  const pollTimer = window.setInterval(() => {
    try {
      if (win.document.URL.indexOf(REDIRECT) !== -1) {
        window.clearInterval(pollTimer);
        const url = win.document.URL;
        gup(url, 'code', win, (code) => {
          authenticateAgainstServer(code, callback);
        });
      }
    } catch (e) {
      // empty
    }
  }, 100);
}

export default {

  login(callback) {
    let clientId = null;
    let redirectUri = null;
    if (window.location.hostname === 'localhost') {
      clientId = config.clientId;
      redirectUri = config.redirectUri;
    } else {
      clientId = config.prodClientId;
      redirectUri = config.prodRedirectUrl;
    }
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;
    getGithubCode(url, redirectUri, callback);
  },

  logout() {
    store.clearAll();
  },

  getToken() {
    return store.get('token');
  },

  getKey() {
    return store.get('api_key');
  },

};
