import { onlineManager } from "@tanstack/react-query";
import createClient from "openapi-fetch";
import type { paths } from "../types/api.generated";
import { API_BASE_URL } from "../config/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
let sessionToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setApiSession(
  token: string | null,
  expired: (() => void) | null = null,
): void {
  sessionToken = token;
  onUnauthorized = expired;
}
export function isCurrentSession(token: string | null): boolean {
  return token === sessionToken;
}

async function timedFetch(input: Request): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (input.signal.aborted) abort();
  input.signal.addEventListener("abort", abort);
  const timeout = setTimeout(abort, 20000);
  const headers = new Headers(input.headers);
  const requestToken = sessionToken;
  if (requestToken && !new URL(input.url).pathname.startsWith("/auth/")) {
    headers.set("Authorization", "Bearer " + requestToken);
  }
  try {
    const response = await fetch(
      new Request(input, { headers, signal: controller.signal }),
    );
    onlineManager.setOnline(true);
    if (
      response.status === 401 &&
      requestToken &&
      headers.has("Authorization") &&
      isCurrentSession(requestToken)
    ) {
      onUnauthorized?.();
    }
    return response;
  } catch (error: unknown) {
    if (input.signal.aborted) throw error;
    onlineManager.setOnline(false);
    throw new ApiError(
      controller.signal.aborted
        ? "A conexão demorou demais. Tente novamente."
        : "Não foi possível conectar ao servidor.",
      0,
    );
  } finally {
    clearTimeout(timeout);
    input.signal.removeEventListener("abort", abort);
  }
}

// Path, parameters, request bodies and responses are all checked against OpenAPI.
export const api = createClient<paths>({
  baseUrl: API_BASE_URL,
  fetch: timedFetch,
});

export function ensureSuccess(result: {
  error?: unknown;
  response: Response;
}): void {
  if (result.response.ok) return;
  const detail = result.error;
  let message = "Não foi possível concluir a operação.";
  if (
    typeof detail === "object" &&
    detail !== null &&
    "detail" in detail &&
    typeof detail.detail === "string"
  ) {
    message = detail.detail;
  } else if (result.response.status === 422) {
    message = "Confira os campos, as datas e a quantidade de pessoas.";
  }
  throw new ApiError(message, result.response.status);
}
export function unwrap<T>(result: {
  data?: T;
  error?: unknown;
  response: Response;
}): T {
  ensureSuccess(result);
  if (result.data === undefined)
    throw new ApiError("Resposta inválida do servidor.", 502);
  return result.data;
}
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 503)
    return "Este serviço está temporariamente indisponível. Tente novamente mais tarde.";
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}
