import type {
  KakaoPostcodeBridgeConfig,
  KakaoPostcodeHtmlBuildContext,
  KakaoPostcodeRuntimeConfig,
} from './types';

function escapeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
}

function bridgeEnvelope(
  bridge: KakaoPostcodeBridgeConfig,
  type: string,
  payload?: unknown,
): string {
  return escapeJson({
    channel: bridge.channel,
    schemaVersion: bridge.schemaVersion,
    type,
    payload,
  });
}

function buildBootstrapScript(config: KakaoPostcodeRuntimeConfig): string {
  const primaryScriptUrl = escapeJson(config.endpoints.scriptUrl);
  const fallbackScriptUrls = escapeJson(
    config.fallback.enableLegacyScriptFallback
      ? config.endpoints.fallbackScriptUrls
      : [],
  );
  const namespaceCandidates = escapeJson(
    config.api.namespaceMode === 'kakao'
      ? ['kakao.Postcode']
      : config.api.namespaceMode === 'daum'
        ? ['daum.Postcode']
        : config.api.namespaceCandidates,
  );
  const searchConfig = escapeJson(config.search);
  const bridgeConfig = escapeJson(config.bridge);
  const fallbackConfig = escapeJson(config.fallback);

  return `
(function() {
  var BRIDGE = ${bridgeConfig};
  var SEARCH_CONFIG = ${searchConfig};
  var FALLBACK_CONFIG = ${fallbackConfig};
  var PRIMARY_SCRIPT_URL = ${primaryScriptUrl};
  var FALLBACK_SCRIPT_URLS = ${fallbackScriptUrls};
  var NAMESPACE_CANDIDATES = ${namespaceCandidates};
  var root = document.getElementById('postcode-root');

  function send(type, payload) {
    var message = {
      channel: BRIDGE.channel,
      schemaVersion: BRIDGE.schemaVersion,
      type: type,
      payload: payload
    };

    if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  }

  function resolvePath(path) {
    var parts = path.split('.');
    var cursor = window;
    for (var i = 0; i < parts.length; i += 1) {
      if (!cursor || typeof cursor !== 'object') return null;
      cursor = cursor[parts[i]];
    }
    return cursor;
  }

  function resolveConstructor() {
    for (var i = 0; i < NAMESPACE_CANDIDATES.length; i += 1) {
      var candidate = NAMESPACE_CANDIDATES[i];
      var ctor = resolvePath(candidate);
      if (typeof ctor === 'function') {
        send('NAMESPACE_RESOLVED', { candidate: candidate });
        return ctor;
      }
    }
    return null;
  }

  function injectScript(url) {
    send('SCRIPT_LOAD_START', { url: url });

    return new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      var done = false;
      var timer = setTimeout(function() {
        if (done) return;
        done = true;
        reject(new Error('Script load timeout: ' + url));
      }, FALLBACK_CONFIG.scriptLoadTimeoutMs);

      script.src = url;
      script.async = true;
      script.onload = function() {
        if (done) return;
        done = true;
        clearTimeout(timer);
        send('SCRIPT_LOADED', { url: url });
        resolve();
      };
      script.onerror = function() {
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(new Error('Script load failed: ' + url));
      };

      document.head.appendChild(script);
    });
  }

  function allScriptUrls() {
    return [PRIMARY_SCRIPT_URL].concat(FALLBACK_SCRIPT_URLS || []);
  }

  function tryLoadScriptsSequentially(urls, index) {
    if (index >= urls.length) {
      return Promise.reject(new Error('All script urls failed.'));
    }

    return injectScript(urls[index]).catch(function(error) {
      send('SCRIPT_LOAD_FAILED', { url: urls[index], message: error.message });
      return tryLoadScriptsSequentially(urls, index + 1);
    });
  }

  function openPostcode() {
    var PostcodeCtor = resolveConstructor();
    if (!PostcodeCtor) {
      send('ERROR', {
        code: 'NAMESPACE_NOT_FOUND',
        message: 'No supported Kakao postcode namespace found.',
        details: { namespaceCandidates: NAMESPACE_CANDIDATES }
      });
      return;
    }

    try {
      var instance = new PostcodeCtor({
        oncomplete: function(data) {
          send('COMPLETE', data);
        },
        onresize: function(size) {
          root.style.height = String(size.height || '100%') + 'px';
          send('RESIZE', size);
        },
        onsearch: function(data) {
          send('SEARCH', data);
        },
        width: SEARCH_CONFIG.width,
        height: SEARCH_CONFIG.height,
        maxSuggestItems: SEARCH_CONFIG.maxSuggestItems,
        theme: SEARCH_CONFIG.theme,
        animation: SEARCH_CONFIG.animation,
        autoClose: SEARCH_CONFIG.autoClose
      });

      instance.embed(root, {
        q: SEARCH_CONFIG.defaultQuery || '',
        autoClose: SEARCH_CONFIG.autoClose
      });

      send('OPENED', {
        defaultQuery: SEARCH_CONFIG.defaultQuery || '',
        transportMode: 'embed'
      });
    } catch (error) {
      send('ERROR', {
        code: 'POSTCODE_INIT_FAILED',
        message: error && error.message ? error.message : 'Postcode init failed.',
        details: error
      });
    }
  }

  send('BOOT', {
    serviceUrl: ${escapeJson(config.endpoints.serviceUrl)},
    guideUrl: ${escapeJson(config.endpoints.guideUrl)}
  });

  tryLoadScriptsSequentially(allScriptUrls(), 0)
    .then(openPostcode)
    .catch(function(error) {
      send('ERROR', {
        code: 'SCRIPT_LOAD_FAILED',
        message: error && error.message ? error.message : 'All script loads failed.',
        details: { urls: allScriptUrls() }
      });
    });
})();
`.trim();
}

export function buildKakaoPostcodeHtml(
  context: KakaoPostcodeHtmlBuildContext,
): string {
  const { config } = context;
  const script = buildBootstrapScript(config);

  return `
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1"
    />
    <title>Kakao Postcode</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #ffffff;
        overflow: hidden;
      }
      #postcode-root {
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="postcode-root"></div>
    <script>${script}</script>
  </body>
</html>
`.trim();
}
