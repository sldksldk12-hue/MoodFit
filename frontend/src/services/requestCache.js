/**
 * 짧은 시간 안에 같은 GET 요청이 반복되는 것을 막는 프론트엔드 메모리 캐시입니다.
 *
 * 1) 진행 중인 요청도 공유하므로 여러 ProductCard가 동시에 같은 API를 호출해도
 *    실제 네트워크 요청은 한 번만 전송됩니다.
 * 2) TTL 동안 완료된 응답을 재사용해 페이지를 다시 방문할 때 즉시 표시합니다.
 * 3) POST/PUT/DELETE 이후에는 invalidateRequestCache로 관련 캐시를 지웁니다.
 */
const responseCache = new Map();
const pendingRequests = new Map();

export const getCachedRequest = async (key, requestFn, ttl = 60_000) => {
  const now = Date.now();
  const cached = responseCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const pending = Promise.resolve()
    .then(requestFn)
    .then((data) => {
      responseCache.set(key, { data, expiresAt: Date.now() + ttl });
      return data;
    })
    .finally(() => pendingRequests.delete(key));

  pendingRequests.set(key, pending);
  return pending;
};

export const invalidateRequestCache = (prefix) => {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) responseCache.delete(key);
  }
};

export const clearRequestCache = () => {
  responseCache.clear();
  pendingRequests.clear();
};
