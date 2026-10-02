import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const InstallAppPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
  )
  const [showInstructions, setShowInstructions] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  useEffect(() => {
    const isPostRegistration = location.pathname === '/dashboard' &&
      new URLSearchParams(location.search).get('install') === '1'

    if (!isPostRegistration) return

    if (!isInstalled && localStorage.getItem('callive-install-prompt-seen') !== '1') {
      localStorage.setItem('callive-install-prompt-seen', '1')
      setShowInstructions(true)
    }
    navigate('/dashboard', { replace: true })
  }, [isInstalled, location.pathname, location.search, navigate])

  const handleInstall = async () => {
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') setIsInstalled(true)
    } catch (error) {
      console.error('Could not open the browser install prompt:', error)
    }
    setDeferredPrompt(null)
    setShowInstructions(false)
  }

  const getInstructions = () => {
    const userAgent = navigator.userAgent
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    if (isIOS) return 'Tap Share, choose “Add to Home Screen”, then tap “Add”.'
    if (/Firefox/i.test(userAgent) && /Android/i.test(userAgent)) {
      return 'Open the Firefox menu (⋮), then choose “Install” or “Add to Home Screen”.'
    }
    if (/Firefox/i.test(userAgent) && /Win/i.test(navigator.userAgentData?.platform || navigator.platform)) {
      return 'In Firefox 143 or later on Windows, use the web apps button in the address bar to add Callive.'
    }
    if (/Safari/i.test(userAgent) && !/Chrome|Chromium|CriOS|Edg/i.test(userAgent)) {
      return 'In Safari, choose File → Add to Dock to install Callive.'
    }
    if (/Firefox/i.test(userAgent)) {
      return 'You can bookmark Callive, or open it in a browser that offers “Install app”.'
    }
    return 'Open your browser menu and choose “Install Callive”, “Install app”, or “Add to Home Screen”.'
  }

  if (isInstalled || !showInstructions) return null

  return (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-4 sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowInstructions(false)
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="install-app-title" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="" className="size-9" />
                <div>
                  <h2 id="install-app-title" className="font-semibold text-slate-900">Install Callive</h2>
                  <p className="text-sm text-slate-500">Add a shortcut for quicker access.</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowInstructions(false)} aria-label="Close install instructions" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <p className="text-sm leading-6 text-slate-700">
              {deferredPrompt ? 'Install Callive on your device for quicker access.' : getInstructions()}
            </p>
            <button
              type="button"
              onClick={deferredPrompt ? handleInstall : () => setShowInstructions(false)}
              className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              {deferredPrompt ? <><Download size={16} className="mr-2 inline" />Install Callive</> : 'Got it'}
            </button>
          </section>
        </div>
  )
}

export default InstallAppPrompt
