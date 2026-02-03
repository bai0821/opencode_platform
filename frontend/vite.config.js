import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { join } from 'path'

// 讀取專案根目錄的 .env
function loadRootEnv() {
  const envPath = join(process.cwd(), '..', '.env')
  const env = {}
  try {
    const content = readFileSync(envPath, 'utf-8')
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && !key.startsWith('#')) {
        env[key.trim()] = valueParts.join('=').trim()
      }
    })
  } catch (e) {
    // .env 文件可能不存在
  }
  return env
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 載入環境變數
  const viteEnv = loadEnv(mode, process.cwd(), '')
  const rootEnv = loadRootEnv()
  
  // API 配置 - 優先使用 root .env，然後是 vite env，最後是默認值
  const API_HOST = rootEnv.API_HOST || viteEnv.API_HOST || 'localhost'
  const API_PORT = rootEnv.API_PORT || viteEnv.API_PORT || '8888'
  const API_URL = viteEnv.VITE_API_URL || `http://localhost:${API_PORT}`  // 固定使用 localhost
  
  // 前端端口
  const FRONTEND_PORT = parseInt(rootEnv.FRONTEND_PORT || viteEnv.FRONTEND_PORT || '5173')

  console.log(`[Vite] API URL: ${API_URL}`)
  console.log(`[Vite] Frontend Port: ${FRONTEND_PORT}`)

  return {
    plugins: [react()],
    
    server: {
      port: FRONTEND_PORT,
      proxy: {
        '/api': {
          target: API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          // 支援 SSE
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('[Proxy Error]', err)
            })
          }
        }
      }
    },
    
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    
    // 定義全域變數供前端使用
    define: {
      __API_URL__: JSON.stringify(API_URL)
    }
  }
})
