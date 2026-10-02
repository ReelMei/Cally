import { createContext, useContext, useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

const InstallAppContext = createContext(null)

export const InstallAppProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone === true

    setIsInstalled(isInStandaloneMode)

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

  return (
    <InstallAppContext.Provider value={{ deferredPrompt, setDeferredPrompt, isInstalled, setIsInstalled }}>
      {children}
    </InstallAppContext.Provider>
  )
}

const getInstallInstructions = () => {
  const userAgent = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  if (isIOS) {
    return 'Tap the Share button in your browser, choose “Add to Home Screen”, then tap “Add”.'
  }

  if (/Firefox/i.test(userAgent) && /Android/i.test(userAgent)) {
    return 'Open the Firefox menu (⋮), then choose “Install” or “Add to Home Screen”.'
  }

  if (/Firefox/i.test(userAgent) && /Win/i.test(navigator.userAgentData?.platform || navigator.platform)) {
    return 'In Firefox 143 or later on Windows, use the web apps button in the address bar to add Callive to your taskbar.'
  }

  if (/Safari/i.test(userAgent) && !/Chrome|Chromium|CriOS|Edg/i.test(userAgent)) {
    return 'In Safari, choose File → Add to Dock to install Callive as an app.'
  }

  if (/Firefox/i.test(userAgent)) {
    return 'This Firefox version may not support app installation on this device. You can bookmark Callive, or open it in a browser that offers “Install app”.'
  }

  return 'Open your browser menu and choose “Install Callive”, “Install app”, or “Add to Home Screen”.'
}

const InstallAppButton = () => {
  const { deferredPrompt, setDeferredPrompt, isInstalled, setIsInstalled } = useContext(InstallAppContext)
  const [showInstructions, setShowInstructions] = useState(false)

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowInstructions(true)
      return
    }

    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      setDeferredPrompt(null)

      if (choice.outcome === 'accepted') {
        setIsInstalled(true)
      } else {
        setShowInstructions(true)
      }
    } catch (error) {
      console.error('Could not open the browser install prompt:', error)
      setDeferredPrompt(null)
      setShowInstructions(true)
    }
  }

  if (isInstalled) return null

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 transition hover:bg-blue-100 sm:px-4"
      >
        <Download size={15} />
        <span>Install app</span>
      </button>

      {showInstructions && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-4 sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowInstructions(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-app-title"
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="" className="size-9" />
                <div>
                  <h2 id="install-app-title" className="font-semibold text-slate-900">Install Callive</h2>
                  <p className="text-sm text-slate-500">Add a shortcut for quicker access.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                aria-label="Close install instructions"
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm leading-6 text-slate-700">{getInstallInstructions()}</p>

            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Got it
            </button>
          </section>
        </div>
      )}
    </>
  )
}

export default InstallAppButton
