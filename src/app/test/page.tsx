export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🎉 Test Page Working!
        </h1>
        <p className="text-gray-600 mb-4">
          This is a simple test page to verify Next.js is working correctly.
        </p>
        <div className="space-y-2">
          <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
          <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
        </div>
        <div className="mt-6">
          <a 
            href="/fa" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to Persian Page
          </a>
          <a 
            href="/en" 
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
          >
            Go to English Page
          </a>
        </div>
      </div>
    </div>
  );
}