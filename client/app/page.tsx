import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl shadow-purple-500/30 mb-8">
          <MessageSquare className="text-white" size={40} />
        </div>

        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
          Welcome to AI Talk
        </h1>

        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Experience the future of conversation with our advanced AI-powered chat platform.
          Connect, learn, and explore with intelligent conversations.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 border-gray-200"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="p-6 bg-white rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold mb-2">Fast & Reliable</h3>
            <p className="text-gray-600 text-sm">
              Lightning-fast responses powered by cutting-edge AI technology
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
            <p className="text-gray-600 text-sm">
              Your conversations are encrypted and protected
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-lg font-semibold mb-2">Smart & Intuitive</h3>
            <p className="text-gray-600 text-sm">
              Natural conversations that understand context and intent
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
