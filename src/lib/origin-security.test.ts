import assert from "node:assert/strict";
import { isSameOriginRequest } from "./origin-security";

const proxiedRequest = new Request("http://localhost:3703/api/leads/", {
  headers: {
    host: "127.0.0.1:3703",
    origin: "http://127.0.0.1:3703"
  }
});
assert.equal(isSameOriginRequest(proxiedRequest), true);

const tlsProxyRequest = new Request("http://127.0.0.1:3000/api/leads/", {
  headers: {
    host: "pravopoisk.ru",
    origin: "https://pravopoisk.ru",
    "x-forwarded-proto": "https"
  }
});
assert.equal(isSameOriginRequest(tlsProxyRequest), true);

const spoofedForwardedHost = new Request("https://pravopoisk.ru/api/leads/", {
  headers: {
    host: "pravopoisk.ru",
    origin: "https://example.org",
    "x-forwarded-host": "example.org"
  }
});
assert.equal(isSameOriginRequest(spoofedForwardedHost), false);

const crossOriginRequest = new Request("https://pravopoisk.ru/api/leads/", {
  headers: {
    host: "pravopoisk.ru",
    origin: "https://example.org"
  }
});
assert.equal(isSameOriginRequest(crossOriginRequest), false);

const sameOriginReferer = new Request("https://pravopoisk.ru/api/leads/", {
  headers: {
    host: "pravopoisk.ru",
    referer: "https://pravopoisk.ru/documents/example/"
  }
});
assert.equal(isSameOriginRequest(sameOriginReferer), true);

const invalidReferer = new Request("https://pravopoisk.ru/api/leads/", {
  headers: { referer: "not-a-url" }
});
assert.equal(isSameOriginRequest(invalidReferer), false);

console.log("origin security tests passed");

