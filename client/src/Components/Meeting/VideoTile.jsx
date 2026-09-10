import { MicOff, User, VideoOff } from 'lucide-react';
import React, { useEffect, useRef } from 'react'

const VideoTile = ({stream, name, isLocal = false, audioEnabled = true, videoEnabled = true}) => {

    const videoRef = useRef(null)

    useEffect(() => {
        if(videoRef.current && stream){
            videoRef.current.srcObject = stream;
        }
    }, [stream])

  return (
    <div className='w-full h-full min-h-50 relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md flex items-center justify-center group'>
      
      {/* Video Component */}
      <video ref={videoRef} autoPlay playsInline muted={isLocal} className={`w-full h-full object-cover transition-opacity dration-300 ${videoEnabled ? "opacity-100" : "opacity-0 pointer-events-none absolute"} ${isLocal ? "-scale-x-100" : ""}`}/>


      {/* Placeholder for video off */}
      {!videoEnabled && (
        <div className='flex flex-col items-center justify-center space-y-3 z-10'>
            <div className='w-20 h-20 rounded-full bg-indigo-600/20 border-2 border-indigo-400/40 flex items-center justify-center text-indigo-300 text-2xl font-bold uppercase shadow-inner'>
                {name ? name.charAt(0) : <User  className='w-8 h-8'/>}
            </div>
            <span className='text-xs font-semibold px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1.5 shadow-xs'>
                <VideoOff className='w-3.5 h-3.5 text-rose-400' />
                Camera Inactive
            </span>
        </div>
      )}

      {/* Footer Info Bar Overlay */}
      <div className='absolute bottom-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none'>
        <div className='flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs font-medium text-white shadowm-md'>
          <span>
            {name} {isLocal ? "(Host)" : ""}
          </span>
          {!audioEnabled && (
            <span className='p-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40'>
                <MicOff className='w-3 h-3'/>
            </span>
          )}
        </div>
      </div>


    </div>
  )
}

export default VideoTile
