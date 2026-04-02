const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!rawApiBaseUrl && process.env.NODE_ENV !== "production") {
	console.warn(
		"NEXT_PUBLIC_API_BASE_URL is not set. Falling back to http://localhost:4000/api/v1"
	);
}

export const API_BASE_URL = (
	rawApiBaseUrl || "http://localhost:4000/api/v1"
).replace(/\/+$/, "");

type ApiEnvelope<T> = {
	statuscode: number;
	data: T;
	message: string;
	success: boolean;
};

type ApiRequestOptions = {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: unknown;
	headers?: HeadersInit;
	skipAuthRefresh?: boolean;
};

const REFRESH_PATH = "/users/refresh-token";

function isAuthError(status: number, message: string) {
	const normalizedMessage = message.toLowerCase();
	if (status === 401) return true;

	// Backend currently uses 400 in some auth middleware cases.
	if (status === 400) {
		return (
			normalizedMessage.includes("unauthorized") ||
			normalizedMessage.includes("access token") ||
			normalizedMessage.includes("jwt")
		);
	}

	return false;
}

async function tryRefreshAccessToken(): Promise<boolean> {
	const refreshResponse = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
		method: "POST",
		credentials: "include",
		cache: "no-store",
	});

	if (!refreshResponse.ok) return false;

	const refreshPayload = (await refreshResponse.json()) as ApiEnvelope<unknown>;
	return Boolean(refreshPayload.success);
}

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
	const contentType = response.headers.get("content-type") || "";
	if (!contentType.includes("application/json")) {
		return {
			statuscode: response.status,
			data: null as T,
			message: "Unexpected server response",
			success: false,
		};
	}

	return (await response.json()) as ApiEnvelope<T>;
}

export async function apiRequest<T>(
	path: string,
	options: ApiRequestOptions = {}
): Promise<T> {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const url = `${API_BASE_URL}${normalizedPath}`;

	const headers: HeadersInit = {
		...(options.body ? { "Content-Type": "application/json" } : {}),
		...(options.headers || {}),
	};

	const response = await fetch(url, {
		method: options.method || "GET",
		credentials: "include",
		cache: "no-store",
		headers,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});

	const payload = await readEnvelope<T>(response);

	const canAttemptRefresh =
		!options.skipAuthRefresh &&
		normalizedPath !== REFRESH_PATH &&
		isAuthError(response.status, payload.message || "");

	if (canAttemptRefresh) {
		const refreshed = await tryRefreshAccessToken();
		if (refreshed) {
			return apiRequest<T>(normalizedPath, {
				...options,
				skipAuthRefresh: true,
			});
		}
	}

	if (!response.ok || !payload.success) {
		throw new Error(payload.message || "API request failed");
	}

	return payload.data;
}