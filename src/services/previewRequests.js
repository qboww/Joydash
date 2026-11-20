export async function readLimitedResponse(response, maxBytes) {
  if (!response.body) {
    throw new Error("The site did not return a readable preview.");
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const remaining = maxBytes - total;
    const chunk = value.subarray(0, remaining);
    chunks.push(chunk);
    total += chunk.byteLength;
    if (value.byteLength > remaining || total === maxBytes) {
      await reader.cancel();
      break;
    }
  }

  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export async function fetchPreviewResponse(url, maxBytes, expectedType) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error",
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`The site returned HTTP ${response.status}.`);
    }

    const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
    if (!contentType.startsWith(expectedType)) {
      throw new Error(`The site did not provide a ${expectedType} preview.`);
    }
    const bytes = await readLimitedResponse(response, maxBytes);
    return { bytes, contentType, responseUrl: response.url };
  } finally {
    clearTimeout(timeout);
  }
}

export async function forEachWithConcurrency(items, concurrency, callback) {
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const index = nextIndex++;
        await callback(items[index]);
      }
    }
  );
  await Promise.all(workers);
}
