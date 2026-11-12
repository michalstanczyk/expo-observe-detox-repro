# expo-observe + Detox: `fetch()` never resolves on iOS

Minimal reproduction for an `expo-app-metrics` (pulled in by `expo-observe`) bug on iOS. Under Detox, requests made through a `URLSession` that has a delegate complete on the network, but the delegate never receives `didReceiveResponse` / `didCompleteWithError`. In a React Native app this means `fetch()` never settles.

## The app

`App.tsx` is a blank Expo app with `expo-observe` installed. It has one button that calls `fetch('https://example.com/')` and a text that shows `idle` → `loading` → `status 200`. Observe is not configured or called: installing the package is enough, because `expo-app-metrics` installs its URLSession swizzles from its app delegate subscriber.

`e2e/fetch.test.js` taps the button and waits up to 30 s for `status 200`.

## Result

The [Detox iOS workflow](.github/workflows/detox-ios.yml) runs the same test twice on `macos-26` with Xcode 26.6:

| Variant | What changes | Result |
|---|---|---|
| `unpatched` | stock `expo-observe` / `expo-app-metrics` | fails: the text stays `loading` |
| `patched` | [`patches/expo-app-metrics-delegate-proxy.patch`](patches/expo-app-metrics-delegate-proxy.patch) applied to `node_modules/expo-app-metrics` | passes |

## Why

Both Detox and `expo-app-metrics` swizzle `+[NSURLSession sessionWithConfiguration:delegate:delegateQueue:]`:

1. Detox (DetoxSync, `NSURLSession+DTXSpy.m`) dynamically subclasses the delegate it receives. The subclass overrides `URLSession:task:didCompleteWithError:` and `URLSession:dataTask:didReceiveResponse:completionHandler:`, and calls `super` only if `[superclass instancesRespondToSelector:cmd]`.
2. `expo-app-metrics` installs its swizzle later, so it runs first. It wraps the app's delegate in `DelegateProxy` and passes the proxy on, so Detox subclasses the proxy.
3. `DelegateProxy` forwards those selectors dynamically (`responds(to:)` / `forwardingTarget(for:)`) but does not implement them, so `instancesRespondToSelector:` returns NO and the callbacks are dropped.

The patch gives `DelegateProxy` concrete implementations of both selectors that dispatch to the wrapped delegate through the Obj-C runtime. A Swift protocol cast is not enough: some delegates, for example expo-file-system's `EXSessionTaskDispatcher`, implement these selectors while declaring only `NSURLSessionDelegate`.

## Run it locally

Requires Xcode 26.6 and an iPhone 17 simulator.

```sh
npm ci
# optional: apply the fix
# patch -p1 -d node_modules/expo-app-metrics < patches/expo-app-metrics-delegate-proxy.patch
npx expo prebuild --platform ios --clean
npx detox build -c ios.sim.release
npx detox test -c ios.sim.release
```
