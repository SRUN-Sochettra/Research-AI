export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="h-32 animate-pulse rounded-lg bg-gray-100"></div>
  );
}
