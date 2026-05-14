// Typed fetch wrapper with error handling
export async function fetchApi<T>(
    url: string,
    options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
    try {
        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                ...options?.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({ error: "Request failed" }));
            return {
                data: null,
                error:
                    errorData.error ||
                    `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        const data = await response.json();
        return { data, error: null };
    } catch (err) {
        return {
            data: null,
            error:
                err instanceof Error
                    ? err.message
                    : "Network error occurred",
        };
    }
}