export default function UploadForm() {
  return (
    <form className="space-y-4 rounded-lg border p-6">
      <h2 className="text-lg font-semibold">Upload Document</h2>
      <input type="file" accept=".pdf" className="block w-full" />
      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">Upload</button>
    </form>
  );
}
