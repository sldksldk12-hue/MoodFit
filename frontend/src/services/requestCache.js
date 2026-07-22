/**
 * 프론트엔드 메모리 캐시
 *
 * 같은 API를 여러 컴포넌트가 동시에 요청하더라도 실제 네트워크 요청은 한 번만 보냅니다.
 * 완료된 응답은 TTL 동안 재사용하여 페이지 이동 후 다시 돌아왔을 때 즉시 표시합니다.
 */
const responseCache = new Map();
const pendingRequests = new Map();

export const getCachedRequest = async (key, requestFn, ttl = 60_000) => {
  const now = Date.now();
  const cached = responseCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  // 이미 같은 요청이 진행 중이면 새 요청을 만들지 않고 기존 Promise를 공유합니다.
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const request = Promise.resolve()
    .then(requestFn)
    .then((data) => {
      responseCache.set(key, {
        data,
        expiresAt: Date.now() + ttl,
      });
      return data;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, request);
  return request;
};

export const invalidateRequestCache = (keyPrefix) => {
  for (const key of responseCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      responseCache.delete(key);
    }
  }
};

export const clearRequestCache = () => {
  responseCache.clear();
  pendingRequests.clear();
};
