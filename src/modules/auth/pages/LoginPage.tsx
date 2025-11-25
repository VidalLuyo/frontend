import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LogIn, School } from "lucide-react"

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (username === "admin123" && password === "123456") {
      navigate("/institucion")
    } else {
      setError("Usuario o contraseña incorrectos")
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
{/* === LADO IZQUIERDO: IMAGEN NÍTIDA Y CLARA === */}
<div className="hidden lg:flex lg:w-1/2 relative">
  {/* Imagen 100% nítida */}
  <img
    src="https://3.bp.blogspot.com/-9BGgJ-jBG_Q/WNEWfJnUKwI/AAAAAAAAA1A/BKJxONM2w1kvfzLYBzWpG-LeSj7lHiyPQCEw/s1600/biometria2.png"
    alt="Niños jugando en patio escolar"
    className="absolute inset-0 w-full h-full object-cover"
    loading="lazy"
  />

  {/* Fondo semi-transparente SOLO detrás del texto */}
  <div className="absolute inset-0 flex items-center justify-center p-12">
    <div className="max-w-md text-center backdrop-blur-sm bg-white/20 rounded-2xl p-8 shadow-xl border border-white/30">
      <div className="flex items-center justify-center gap-3 mb-4">
        <School size={48} className="text-blue-700" />
        <h1 className="text-5xl font-bold text-blue-900">SIGEI</h1>
      </div>
      <p className="text-lg font-medium text-blue-800 leading-relaxed">
        Sistema Integral de Gestión Educativa para <br />
        <span className="font-bold text-blue-600">Colegios Estatales</span>
      </p>
    </div>
  </div>

  {/* Puntos animados opcionales (puedes quitarlos si distraen) */}
  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ))}
  </div>
</div>

      {/* === LADO DERECHO: FORMULARIO DE LOGIN === */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-full max-w-md">
          {/* Logo pequeño en móvil */}
          <div className="flex lg:hidden items-center justify-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl shadow-lg">
              <span className="text-white text-2xl font-bold">S</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-10 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Bienvenido</h2>
              <p className="text-gray-600 mt-2">Inicia sesión en tu cuenta institucional</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-400 text-gray-900 font-medium"
                  placeholder="admin123"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-400 text-gray-900 font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-pulse">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg"
              >
                <LogIn size={20} />
                Iniciar Sesión
              </button>
            </form>

            {/* Credenciales temporales (solo en desarrollo) */}
            {import.meta.env.MODE === "development" && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-bold text-amber-800 mb-1">Credenciales de prueba:</p>
                <p className="text-xs text-amber-700">Usuario: <span className="font-mono">admin123</span></p>
                <p className="text-xs text-amber-700">Contraseña: <span className="font-mono">123456</span></p>
              </div>
            )}
          </div>

          {/* Footer institucional */}
          <p className="text-center text-xs text-gray-500 mt-8">
            © 2025 SIGEI - Ministerio de Educación | Versión 1.0
          </p>
        </div>
      </div>
    </div>
  )
}